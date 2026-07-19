"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function SignupPage() {
  const router = useRouter();

  // Auth Redirect Guard
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isAuth = localStorage.getItem("user_authenticated") === "true";
      if (isAuth) {
        router.push("/dashboard");
      }
    }
  }, [router]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Validation States
  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);
  const [termsError, setTermsError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const validateName = (val: string) => {
    if (!val.trim()) return "Full name is required";
    return null;
  };

  const validateEmail = (val: string) => {
    if (!val.trim()) return "Email is required";
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!pattern.test(val)) return "Please enter a valid email address";
    return null;
  };

  const validatePassword = (val: string) => {
    if (!val) return "Password is required";
    if (val.length < 8) return "Password must be at least 8 characters";
    if (!/[A-Z]/.test(val)) return "Must include at least one uppercase letter";
    if (!/[a-z]/.test(val)) return "Must include at least one lowercase letter";
    if (!/[0-9]/.test(val)) return "Must include at least one number";
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(val)) return "Must include at least one special character";
    return null;
  };

  const validateConfirmPassword = (val: string, pass: string) => {
    if (!val) return "Please confirm your password";
    if (val !== pass) return "Passwords do not match";
    return null;
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    if (nameError) setNameError(validateName(val));
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEmail(val);
    if (emailError) setEmailError(validateEmail(val));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPassword(val);
    if (passwordError) setPasswordError(validatePassword(val));
    if (confirmPasswordError) setConfirmPasswordError(validateConfirmPassword(confirmPassword, val));
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setConfirmPassword(val);
    if (confirmPasswordError) setConfirmPasswordError(validateConfirmPassword(val, password));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const nErr = validateName(name);
    const eErr = validateEmail(email);
    const pErr = validatePassword(password);
    const cpErr = validateConfirmPassword(confirmPassword, password);
    const tErr = !acceptTerms ? "You must accept the Terms of Service to proceed" : null;

    setNameError(nErr);
    setEmailError(eErr);
    setPasswordError(pErr);
    setConfirmPasswordError(cpErr);
    setTermsError(tErr);

    if (nErr || eErr || pErr || cpErr || tErr) return;

    setSubmitting(true);
    setTimeout(() => {
      localStorage.setItem("user_authenticated", "true");
      localStorage.setItem("user_email", email);
      localStorage.setItem("user_name", name);
      router.push("/dashboard");
      setSubmitting(false);
    }, 1000);
  };


  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen flex flex-col md:flex-row bg-[#fafafb] font-sans antialiased text-gray-800"
    >
      {/* LEFT PANEL */}
      <div className="w-full md:w-5/12 bg-[#26212e] text-white p-8 md:p-16 flex flex-col justify-between relative overflow-hidden shrink-0 select-none min-h-[300px] md:min-h-screen">
        {/* Background Gradients */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Logo and Name */}
        <Link href="/" className="inline-flex items-center gap-2.5 outline-none self-start z-10">
          <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white text-base shadow-sm">
            F
          </div>
          <span className="text-lg font-bold tracking-tight text-white">FormNest</span>
        </Link>

        {/* Left Core Message */}
        <div className="my-auto py-10 md:py-0 z-10 max-w-sm space-y-4">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Already have an account?</h2>
          <p className="text-xs text-gray-300 leading-relaxed font-medium">
            Sign in to continue where you left off.
          </p>
        </div>

        {/* Action Button to Login */}
        <div className="z-10">
          <Link
            href="/login"
            className="inline-flex items-center justify-center px-6 py-2.5 bg-white/10 hover:bg-white/15 text-white border border-white/20 hover:border-white/30 rounded-xl text-xs font-bold transition-all"
          >
            Sign In
          </Link>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 md:p-16 bg-white min-h-[500px]">
        <div className="w-full max-w-md space-y-7">
          
          {/* Header */}
          <div className="space-y-1.5">
            <h1 className="text-2xl font-black tracking-tight text-gray-900">Create your account</h1>
            <p className="text-xs text-gray-400 font-semibold">
              Start building beautiful forms today.
            </p>
          </div>

          {/* Form */}
          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            
            {/* Full Name */}
            <div>
              <label htmlFor="name" className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
                Full Name
              </label>
              <div className="mt-1.5 relative">
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={name}
                  onChange={handleNameChange}
                  aria-invalid={!!nameError}
                  aria-describedby={nameError ? "name-error" : undefined}
                  placeholder="John Doe"
                  className={`w-full h-11 border rounded-xl px-4 text-xs font-semibold outline-none transition-all placeholder-gray-400 ${
                    nameError
                      ? "border-red-500 bg-red-50/10 focus:border-red-500"
                      : "border-gray-200 bg-gray-50 focus:border-gray-400 focus:bg-white"
                  }`}
                />
                {nameError && (
                  <p id="name-error" className="text-[10px] text-red-600 font-bold mt-1.5 flex items-center gap-1">
                    <span>⚠️</span> {nameError}
                  </p>
                )}
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label htmlFor="email" className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
                Email Address
              </label>
              <div className="mt-1.5 relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={handleEmailChange}
                  aria-invalid={!!emailError}
                  aria-describedby={emailError ? "email-error" : undefined}
                  placeholder="name@example.com"
                  className={`w-full h-11 border rounded-xl px-4 text-xs font-semibold outline-none transition-all placeholder-gray-400 ${
                    emailError
                      ? "border-red-500 bg-red-50/10 focus:border-red-500"
                      : "border-gray-200 bg-gray-50 focus:border-gray-400 focus:bg-white"
                  }`}
                />
                {emailError && (
                  <p id="email-error" className="text-[10px] text-red-600 font-bold mt-1.5 flex items-center gap-1">
                    <span>⚠️</span> {emailError}
                  </p>
                )}
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
                Password
              </label>
              <div className="mt-1.5 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={handlePasswordChange}
                  aria-invalid={!!passwordError}
                  aria-describedby={passwordError ? "password-error" : undefined}
                  placeholder="••••••••"
                  className={`w-full h-11 border rounded-xl pl-4 pr-11 text-xs font-semibold outline-none transition-all placeholder-gray-400 ${
                    passwordError
                      ? "border-red-500 bg-red-50/10 focus:border-red-500"
                      : "border-gray-200 bg-gray-50 focus:border-gray-400 focus:bg-white"
                  }`}
                />
                
                {/* Visibility Toggle */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 outline-none text-xs font-bold"
                >
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span
                      key={showPassword ? "visible" : "hidden"}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.15 }}
                    >
                      {showPassword ? "HIDE" : "SHOW"}
                    </motion.span>
                  </AnimatePresence>
                </button>
              </div>
              {passwordError && (
                <p id="password-error" className="text-[10px] text-red-600 font-bold mt-1.5 flex items-center gap-1">
                  <span>⚠️</span> {passwordError}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
                Confirm Password
              </label>
              <div className="mt-1.5 relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={handleConfirmPasswordChange}
                  aria-invalid={!!confirmPasswordError}
                  aria-describedby={confirmPasswordError ? "confirm-password-error" : undefined}
                  placeholder="••••••••"
                  className={`w-full h-11 border rounded-xl pl-4 pr-11 text-xs font-semibold outline-none transition-all placeholder-gray-400 ${
                    confirmPasswordError
                      ? "border-red-500 bg-red-50/10 focus:border-red-500"
                      : "border-gray-200 bg-gray-50 focus:border-gray-400 focus:bg-white"
                  }`}
                />
                
                {/* Visibility Toggle */}
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 outline-none text-xs font-bold"
                >
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span
                      key={showConfirmPassword ? "visible" : "hidden"}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.15 }}
                    >
                      {showConfirmPassword ? "HIDE" : "SHOW"}
                    </motion.span>
                  </AnimatePresence>
                </button>
              </div>
              {confirmPasswordError && (
                <p id="confirm-password-error" className="text-[10px] text-red-600 font-bold mt-1.5 flex items-center gap-1">
                  <span>⚠️</span> {confirmPasswordError}
                </p>
              )}
            </div>

            {/* Accept Terms Checkbox */}
            <div>
              <div className="flex items-start pt-1">
                <input
                  id="accept-terms"
                  name="accept-terms"
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => {
                    setAcceptTerms(e.target.checked);
                    if (e.target.checked) setTermsError(null);
                  }}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer mt-0.5"
                />
                <label htmlFor="accept-terms" className="ml-2 block text-xs font-bold text-gray-500 select-none cursor-pointer leading-relaxed">
                  I accept the{" "}
                  <span className="text-blue-600 hover:underline">Terms of Service</span> and{" "}
                  <span className="text-blue-600 hover:underline">Privacy Policy</span>.
                </label>
              </div>
              {termsError && (
                <p className="text-[10px] text-red-600 font-bold mt-1.5 flex items-center gap-1">
                  <span>⚠️</span> {termsError}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-xs shadow-blue-500/10 hover:shadow-md hover:shadow-blue-500/20"
              >
                {submitting ? "Creating account..." : "Create Account"}
              </button>
            </div>
          </form>

          {/* Divider */}
          {/* Bottom Switch Link */}
          <div className="text-center text-xs font-semibold text-gray-500 pt-2 select-none">
            Already have an account?{" "}
            <Link href="/login" className="text-blue-600 hover:text-blue-700 hover:underline font-bold">
              Sign In
            </Link>
          </div>

        </div>
      </div>
    </motion.div>
  );
}
