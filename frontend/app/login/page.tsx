"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { loginUser } from "@/lib/api";
import GoogleOAuthButton from "@/components/GoogleOAuthButton";

export default function LoginPage() {
  const router = useRouter();

  // Auth Redirect Guard & Query Params
  const [justRegistered, setJustRegistered] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Validation & Server Error States
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isAuth = localStorage.getItem("user_authenticated") === "true";
      if (isAuth) {
        router.push("/dashboard");
        return;
      }

      const params = new URLSearchParams(window.location.search);
      if (params.get("registered") === "true") {
        setJustRegistered(true);
      }
      const prefillEmail = params.get("email");
      if (prefillEmail) {
        setEmail(prefillEmail);
      }
    }
  }, [router]);

  const validateEmail = (val: string) => {
    if (!val.trim()) return "Email is required";
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!pattern.test(val)) return "Please enter a valid email address";
    return null;
  };

  const validatePassword = (val: string) => {
    if (!val) return "Password is required";
    return null;
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEmail(val);
    if (emailError) setEmailError(validateEmail(val));
    setServerError(null);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPassword(val);
    if (passwordError) setPasswordError(validatePassword(val));
    setServerError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    
    const eErr = validateEmail(email);
    const pErr = validatePassword(password);
    
    setEmailError(eErr);
    setPasswordError(pErr);

    if (eErr || pErr) return;

    setSubmitting(true);
    try {
      const authRes = await loginUser(email, password);
      
      // Store session data in local storage
      localStorage.setItem("user_authenticated", "true");
      localStorage.setItem("user_id", authRes.user.id.toString());
      localStorage.setItem("user_email", authRes.user.email);
      localStorage.setItem("user_name", authRes.user.name);
      
      // Reset selected workspace cache to allow auto-select of user's workspace
      localStorage.removeItem("dashboard_selected_workspace_id");

      router.push("/dashboard");
    } catch (err: any) {
      setServerError(err.message || "Invalid email or password.");
    } finally {
      setSubmitting(false);
    }
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
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Welcome Back</h2>
          <p className="text-xs text-gray-300 leading-relaxed font-medium">
            Sign in to continue building beautiful forms and managing your responses.
          </p>
        </div>

        {/* Action Button to Signup */}
        <div className="z-10">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center px-6 py-2.5 bg-white/10 hover:bg-white/15 text-white border border-white/20 hover:border-white/30 rounded-xl text-xs font-bold transition-all"
          >
            Create Account
          </Link>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 md:p-16 bg-white min-h-[500px]">
        <div className="w-full max-w-md space-y-7">
          
          {/* Header */}
          <div className="space-y-1.5">
            <h1 className="text-2xl font-black tracking-tight text-gray-900">Welcome Back</h1>
            <p className="text-xs text-gray-400 font-semibold">
              Please enter your credentials to access your account.
            </p>
          </div>

          {justRegistered && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs">
              <span>🎉</span> Account created successfully! Please sign in with your email and password.
            </div>
          )}

          {serverError && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs">
              <span>⚠️</span> {serverError}
            </div>
          )}

          {/* Google OAuth Sign In */}
          <GoogleOAuthButton mode="login" onError={(err) => setServerError(err)} />

          {/* Divider */}
          <div className="relative flex items-center justify-center my-4">
            <div className="border-t border-gray-200 w-full" />
            <span className="bg-white px-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest absolute">
              Or continue with email
            </span>
          </div>

          {/* Form */}
          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            
            {/* Email Field */}
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

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => alert("Forgot password simulator!")}
                  className="text-xs text-blue-600 hover:text-blue-700 hover:underline font-bold outline-none"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="mt-1.5 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
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
                
                {/* Visibility Toggle Button */}
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

            {/* Remember Me */}
            <div className="flex items-center pt-1.5">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <label htmlFor="remember-me" className="ml-2 block text-xs font-bold text-gray-500 select-none cursor-pointer">
                Remember Me
              </label>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-xs shadow-blue-500/10 hover:shadow-md hover:shadow-blue-500/20"
              >
                {submitting ? "Signing in..." : "Sign In"}
              </button>
            </div>
          </form>

          {/* Divider */}
          {/* Bottom Switch Link */}
          <div className="text-center text-xs font-semibold text-gray-500 pt-2 select-none">
            Don't have an account?{" "}
            <Link href="/signup" className="text-blue-600 hover:text-blue-700 hover:underline font-bold">
              Create Account
            </Link>
          </div>

        </div>
      </div>
    </motion.div>
  );
}
