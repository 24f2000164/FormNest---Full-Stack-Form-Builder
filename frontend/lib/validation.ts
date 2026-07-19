// Pure, local-only validation for the Preview flow. No network calls, no
// side effects - just "is this answer allowed to move the respondent
// forward?" Mirrors the settings the Builder already writes to
// question.settings (e.g. the Email question's validationEnabled /
// validationRegex toggle in QuestionCanvas.tsx) so Preview enforces exactly
// what was configured, plus sensible built-in checks for every type.

type Question = {
  id: number;
  type: string;
  title: string;
  description: string | null;
  required: boolean;
  options: string[] | null;
  settings: Record<string, any> | null;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Digits with optional +, spaces, dashes, dots, and parentheses - loose on
// purpose since phone formats vary a lot by country.
const PHONE_PATTERN = /^\+?[0-9()\-.\s]{7,20}$/;
const NUMBER_PATTERN = /^-?\d+(\.\d+)?$/;

function isEmptyValue(value: any): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") {
    return Object.values(value).every(v => v === undefined || v === null || String(v).trim() === "");
  }
  return false;
}

function requiredMessage(type: string): string {
  switch (type) {
    case "dropdown":
      return "Please select an option";
    case "multiple_choice":
      return "Please select at least one option";
    case "yes_no":
      return "Please choose Yes or No";
    case "rating":
      return "Please give a rating";
    default:
      return "This question requires an answer";
  }
}

// Returns an inline-error message string, or null when the answer is valid
// and the respondent may move forward.
export function validateAnswer(question: Question, value: any): string | null {
  const type = question.type;
  const settings = question.settings || {};

  // Pure content screens (welcome/ending) have no field to validate.
  if (type === "welcome_screen" || type === "ending_screen") return null;

  const empty = isEmptyValue(value);

  if (question.required && empty) {
    return requiredMessage(type);
  }
  if (empty) {
    // Optional and untouched - nothing to validate yet.
    return null;
  }

  switch (type) {
    case "short_text":
    case "long_text":
    case "email":
    case "phone": {
      const text = String(value);

      // A custom regex (set on the Email question in the Builder) takes
      // priority over the built-in format check when it's turned on.
      if (settings.validationEnabled && typeof settings.validationRegex === "string" && settings.validationRegex.trim() !== "") {
        try {
          const re = new RegExp(settings.validationRegex);
          if (!re.test(text)) {
            return "This answer doesn't match the required format";
          }
        } catch {
          // Builder already guards against saving an invalid regex, but
          // fail open here rather than blocking every respondent on a
          // bad pattern that slipped through.
        }
      } else if (type === "email" && !EMAIL_PATTERN.test(text)) {
        return "Please enter a valid email address";
      } else if (type === "phone" && !PHONE_PATTERN.test(text)) {
        return "Please enter a valid phone number";
      }

      const minLength = settings.minLength ?? settings.min_length;
      const maxLength = settings.maxLength ?? settings.max_length;
      if (typeof minLength === "number" && text.length < minLength) {
        return `Answer must be at least ${minLength} character${minLength === 1 ? "" : "s"}`;
      }
      if (typeof maxLength === "number" && text.length > maxLength) {
        return `Answer must be ${maxLength} character${maxLength === 1 ? "" : "s"} or fewer`;
      }
      return null;
    }

    case "number": {
      const text = String(value).trim();
      if (!NUMBER_PATTERN.test(text)) {
        return "Please enter a valid number";
      }
      const num = Number(text);
      const min = settings.min ?? settings.minValue;
      const max = settings.max ?? settings.maxValue;
      if (typeof min === "number" && num < min) return `Must be at least ${min}`;
      if (typeof max === "number" && num > max) return `Must be at most ${max}`;
      return null;
    }

    case "dropdown": {
      const options = question.options || [];
      if (!options.includes(value)) return "Please select a valid option";
      return null;
    }

    case "multiple_choice": {
      const selected: string[] = Array.isArray(value) ? value : [value];
      if (!settings.allowMultiple) return null; // single-select: any non-empty value is valid

      const selectionMode = settings.selectionMode ?? "unlimited";
      const count = selected.length;
      if (selectionMode === "exact") {
        const exact = settings.exactSelectionCount ?? 1;
        if (count !== exact) {
          return `Please select exactly ${exact} option${exact === 1 ? "" : "s"}`;
        }
      } else if (selectionMode === "range") {
        const minSelection = settings.minSelection ?? 1;
        const maxSelection = settings.maxSelection ?? selected.length;
        if (count < minSelection || count > maxSelection) {
          return `Please select between ${minSelection} and ${maxSelection} options`;
        }
      }
      return null;
    }

    case "yes_no": {
      if (value !== "Yes" && value !== "No") return "Please choose Yes or No";
      return null;
    }

    case "rating": {
      const count = settings.rating_count ?? settings.max_rating ?? 5;
      const num = Number(value);
      if (!Number.isFinite(num) || num < 1 || num > count) return "Please give a rating";
      return null;
    }

    case "contact_info": {
      const fields = settings.fields || {};
      const isFirstNameVisible = fields.firstName?.visible ?? true;
      const isLastNameVisible = fields.lastName?.visible ?? true;
      const isPhoneVisible = fields.phone?.visible ?? true;
      const isEmailVisible = fields.email?.visible ?? false;
      const isCompanyVisible = fields.company?.visible ?? false;

      const isFirstNameRequired = fields.firstName?.required ?? false;
      const isLastNameRequired = fields.lastName?.required ?? false;
      const isPhoneRequired = fields.phone?.required ?? false;
      const isEmailRequired = fields.email?.required ?? false;
      const isCompanyRequired = fields.company?.required ?? false;

      const currentVal = value && typeof value === "object" ? value : {};

      if (isFirstNameVisible && (isFirstNameRequired || question.required)) {
        if (!currentVal.firstName || currentVal.firstName.trim() === "") {
          return "Please enter your first name";
        }
      }
      if (isLastNameVisible && (isLastNameRequired || question.required)) {
        if (!currentVal.lastName || currentVal.lastName.trim() === "") {
          return "Please enter your last name";
        }
      }
      if (isPhoneVisible && (isPhoneRequired || question.required)) {
        if (!currentVal.phone || currentVal.phone.trim() === "") {
          return "Please enter your phone number";
        }
      }
      if (isEmailVisible && (isEmailRequired || question.required)) {
        if (!currentVal.email || currentVal.email.trim() === "") {
          return "Please enter your email address";
        }
      }
      if (isCompanyVisible && (isCompanyRequired || question.required)) {
        if (!currentVal.company || currentVal.company.trim() === "") {
          return "Please enter your company name";
        }
      }

      if (isEmailVisible && currentVal.email && currentVal.email.trim() !== "") {
        if (!EMAIL_PATTERN.test(String(currentVal.email))) {
          return "Please enter a valid email address";
        }
      }
      if (isPhoneVisible && currentVal.phone && currentVal.phone.trim() !== "") {
        if (!PHONE_PATTERN.test(String(currentVal.phone))) {
          return "Please enter a valid phone number";
        }
      }

      return null;
    }

    default:
      return null;
  }
}
