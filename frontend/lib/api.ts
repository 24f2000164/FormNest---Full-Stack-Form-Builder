const API_BASE = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

export type FormSummary = {
  id: number;
  title: string;
  status: "draft" | "published";
  response_count: number;
  updated_at: string;
  workspace_id: number | null;
  completion_rate: number;
  slug: string;
};

export type FormRead = {
  id: number;
  title: string;
  description: string | null;
  slug: string;
  status: string;
  created_at: string;
  updated_at: string;
  workspace_id: number | null;
  questions: {
    id: number;
    type: string;
    title: string;
    description: string | null;
    required: boolean;
    order_index: number;
    options: string[] | null;
    settings: Record<string, any> | null;
  }[];
  settings?: Record<string, any> | null;
};

export type QuestionUpdate = {
  type?: string;
  title?: string;
  description?: string;
  required?: boolean;
  options?: string[] | null;
  settings?: Record<string, any> | null;
};

export async function listForms(): Promise<FormSummary[]> {
  const res = await fetch(`${API_BASE}/forms`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load forms");
  return res.json();
}

export async function createForm(title: string, workspaceId?: number): Promise<FormRead> {
  const res = await fetch(`${API_BASE}/forms`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, workspace_id: workspaceId }),
  });
  if (!res.ok) throw new Error("Failed to create form");
  return res.json();
}

export async function getFormBySlug(slug: string): Promise<FormRead> {
  const res = await fetch(`${API_BASE}/forms/slug/${slug}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load form");
  return res.json();
}

export async function getFormById(formId: number): Promise<FormRead> {
  const res = await fetch(`${API_BASE}/forms/${formId}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load form");
  return res.json();
}

export async function updateQuestion(formId: number, questionId: number, payload: QuestionUpdate) {
  const res = await fetch(`${API_BASE}/forms/${formId}/questions/${questionId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to update question");
  return res.json();
}

export async function submitResponse(formId: number, answers: { question_id: number; value: any }[], viewId?: number) {
  const res = await fetch(`${API_BASE}/forms/${formId}/respond`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ answers, view_id: viewId }),
  });
  if (!res.ok) throw new Error("Failed to submit response");
  return res.json();
}

export type ResponseAnswer = {
  question_id: number;
  value: any;
  question_type: string;
  question_title: string;
};

export type FormResponse = {
  id: number;
  form_id: number;
  submitted_at: string;
  completed: boolean;
  answers: ResponseAnswer[];
};

export async function getFormResponses(formId: number): Promise<FormResponse[]> {
  const res = await fetch(`${API_BASE}/forms/${formId}/responses`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load responses");
  return res.json();
}

export type ShareInfo = {
  id: number;
  title: string;
  description: string | null;
  slug: string;
  status: "draft" | "published";
  public_url: string;
  published_at: string | null;
};

export async function getShareInfo(formId: number): Promise<ShareInfo> {
  const res = await fetch(`${API_BASE}/forms/${formId}/share`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load share info");
  return res.json();
}

export class SlugConflictError extends Error {}
export class SlugInvalidError extends Error {}

export async function updateSlug(formId: number, slug: string): Promise<ShareInfo> {
  const res = await fetch(`${API_BASE}/forms/${formId}/slug`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slug }),
  });
  if (res.status === 409) throw new SlugConflictError("This link is already taken.");
  if (res.status === 422) throw new SlugInvalidError("Slug can only contain lowercase letters, numbers, and hyphens.");
  if (!res.ok) throw new Error("Failed to update link");
  return res.json();
}

export type InsightsData = {
  views: number;
  starts: number;
  submissions: number;
  completionRate: number;
  averageCompletionTime: number;
  deviceDistribution: { device: string; count: number; percentage: number }[];
  responsesOverTime: { date: string; count: number }[];
  responseTrend: {
    daily: { label: string; count: number }[];
    weekly: { label: string; count: number }[];
    monthly: { label: string; count: number }[];
  };
  completionFunnel: { stage: string; count: number; percentage: number }[];
  questionInsights: {
    question_id: number;
    title: string;
    type: string;
    views: number;
    answered: number;
    skipped: number;
    dropoffs: number;
    completionRate: number;
    dropoffRate: number;
    averageRating: number | null;
    averageNumber: number | null;
    averageLength: number | null;
    recentAnswers: string[];
    distribution: { option: string; count: number; percentage: number }[];
    mostCommonAnswer: string | null;
  }[];
};

export async function trackFormView(slug: string, device: string): Promise<{ view_id: number }> {
  const res = await fetch(`${API_BASE}/forms/slug/${slug}/view?device=${device}`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to track view");
  return res.json();
}

export async function trackFormStart(viewId: number): Promise<void> {
  const res = await fetch(`${API_BASE}/forms/views/${viewId}/start`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to track start");
}

export async function trackFormProgress(viewId: number, furthestIndex: number): Promise<void> {
  const res = await fetch(`${API_BASE}/forms/views/${viewId}/progress`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ furthest_question_index: furthestIndex }),
  });
  if (!res.ok) throw new Error("Failed to track progress");
}

export async function getFormInsights(
  formId: number,
  filters: { device?: string; dateRange?: string; startDate?: string; endDate?: string }
): Promise<InsightsData> {
  const query = new URLSearchParams();
  if (filters.device) query.set("device", filters.device);
  if (filters.dateRange) query.set("dateRange", filters.dateRange);
  if (filters.startDate) query.set("start_date", filters.startDate);
  if (filters.endDate) query.set("end_date", filters.endDate);

  const res = await fetch(`${API_BASE}/forms/${formId}/insights?${query.toString()}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to load insights");
  return res.json();
}

export async function generateTestResponse(formId: number): Promise<void> {
  const res = await fetch(`${API_BASE}/forms/${formId}/generate-test-response`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to generate test response");
}

export type WorkspaceRead = {
  id: number;
  name: string;
  owner_id: number;
  created_at: string;
  updated_at: string;
};

export type WorkspaceSummary = {
  id: number;
  name: string;
  owner_id: number;
  form_count: number;
  created_at: string;
  updated_at: string;
};

export async function listWorkspaces(): Promise<WorkspaceSummary[]> {
  const res = await fetch(`${API_BASE}/workspaces`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load workspaces");
  return res.json();
}

export async function createWorkspace(name: string): Promise<WorkspaceRead> {
  const res = await fetch(`${API_BASE}/workspaces`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to create workspace");
  }
  return res.json();
}

export async function renameWorkspace(id: number, name: string): Promise<WorkspaceRead> {
  const res = await fetch(`${API_BASE}/workspaces/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to rename workspace");
  }
  return res.json();
}

export async function deleteWorkspace(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/workspaces/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to delete workspace");
  }
}

export async function listWorkspaceForms(
  workspaceId: number,
  sortBy?: string,
  sortOrder?: string
): Promise<FormSummary[]> {
  const query = new URLSearchParams();
  if (sortBy) query.set("sort_by", sortBy);
  if (sortOrder) query.set("sort_order", sortOrder);
  
  const res = await fetch(`${API_BASE}/workspaces/${workspaceId}/forms?${query.toString()}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load workspace forms");
  return res.json();
}

export async function moveForm(formId: number, workspaceId: number): Promise<void> {
  const res = await fetch(`${API_BASE}/forms/${formId}/move`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ workspace_id: workspaceId }),
  });
  if (!res.ok) throw new Error("Failed to move form");
}

export async function copyForm(formId: number, workspaceId: number): Promise<FormRead> {
  const res = await fetch(`${API_BASE}/forms/${formId}/copy`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ workspace_id: workspaceId }),
  });
  if (!res.ok) throw new Error("Failed to copy form");
  return res.json();
}

export async function updateForm(
  formId: number,
  payload: { title?: string; description?: string; workspace_id?: number; settings?: Record<string, any> }
): Promise<FormRead> {
  const res = await fetch(`${API_BASE}/forms/${formId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to update form");
  return res.json();
}


export async function deleteForm(formId: number): Promise<void> {
  const res = await fetch(`${API_BASE}/forms/${formId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete form");
}

export async function inviteToWorkspace(
  workspaceId: number,
  email: string
): Promise<{ status: string; message: string; mock_sent: boolean }> {
  const res = await fetch(`${API_BASE}/workspaces/${workspaceId}/invite`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to send invitation");
  }
  return res.json();
}

export async function duplicateForm(formId: number): Promise<FormRead> {
  const res = await fetch(`${API_BASE}/forms/${formId}/duplicate`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to duplicate form");
  return res.json();
}

export async function leaveWorkspace(workspaceId: number): Promise<void> {
  const res = await fetch(`${API_BASE}/workspaces/${workspaceId}/leave`, {
    method: "POST",
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to leave workspace");
  }
}
