"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";

export default function LandingPage() {
  const router = useRouter();
  const [activeQuestionChoice, setActiveQuestionChoice] = useState<string | null>(null);
  const [demoTab, setDemoTab] = useState<"builder" | "preview" | "results" | "responses">("builder");

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isAuth = localStorage.getItem("user_authenticated") === "true";
      if (isAuth) {
        router.push("/dashboard");
      }
    }
  }, [router]);

  const handleScrollToDemo = () => {
    const element = document.getElementById("demo-showcase");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafb] text-[#26212e] font-sans antialiased overflow-x-hidden selection:bg-blue-100 selection:text-blue-900">
      
      {/* 1. STICKY NAVIGATION BAR (Glassmorphism style) */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-gray-200/50 px-6 lg:px-16 h-16 flex items-center justify-between transition-all duration-300">
        <Link href="/" className="flex items-center gap-2 outline-none">
          {/* Logo Badge */}
          <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white text-base select-none shadow-sm shadow-blue-500/20">
            F
          </div>
          <span className="text-lg font-bold tracking-tight text-gray-900">FormNest</span>
        </Link>

        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-xs font-bold text-gray-600 hover:text-gray-900 transition-colors px-3 py-2 rounded-lg hover:bg-gray-50"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="text-xs font-bold text-gray-600 hover:text-gray-900 transition-colors px-3 py-2 rounded-lg hover:bg-gray-50 hidden sm:inline-block"
          >
            Sign Up
          </Link>
          <Link
            href="/signup"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs shadow-blue-500/10 hover:shadow-md hover:shadow-blue-500/20"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative px-6 lg:px-16 pt-16 pb-20 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        
        {/* Left Side Info */}
        <div className="lg:col-span-6 space-y-6 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-100 rounded-full text-[10px] font-bold text-blue-600 uppercase tracking-wider select-none animate-fade-in">
            Modern Forms. Smarter Insights.
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 tracking-tight leading-tight">
            Build Interactive <br />
            Forms with <span className="text-blue-600 relative">Ease.</span>
          </h1>
          
          <p className="text-base text-gray-500 max-w-md leading-relaxed font-medium">
            Create beautiful forms, collect responses, and analyze results from one modern platform. Built for developers and product creators.
          </p>
          
          <div className="flex flex-wrap gap-4 pt-2">
            <Link
              href="/signup"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-sm shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5"
            >
              Get Started
              <span>➔</span>
            </Link>
            <button
              onClick={handleScrollToDemo}
              className="px-6 py-3 bg-white border border-gray-200 hover:border-gray-300 text-gray-700 hover:text-gray-900 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-2xs hover:shadow-sm"
            >
              View Demo
              <span className="text-blue-500">▶</span>
            </button>
          </div>

          {/* Micro Features Grid */}
          <div className="grid grid-cols-3 gap-4 border-t border-gray-100 pt-8 mt-4">
            <div className="flex items-start gap-2.5">
              <span className="h-7 w-7 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-blue-600" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 7.97 5.132-2.51.52z" />
                </svg>
              </span>
              <div>
                <h4 className="text-xs font-extrabold text-gray-900">Easy to Build</h4>
                <p className="text-[10px] text-gray-400 font-medium">Drag & drop builder</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="h-7 w-7 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
                <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-green-600" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                </svg>
              </span>
              <div>
                <h4 className="text-xs font-extrabold text-gray-900">Share Anywhere</h4>
                <p className="text-[10px] text-gray-400 font-medium">Publish in one click</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="h-7 w-7 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-amber-600" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                </svg>
              </span>
              <div>
                <h4 className="text-xs font-extrabold text-gray-900">Smart Insights</h4>
                <p className="text-[10px] text-gray-400 font-medium">Power analytics</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: High-fidelity visual mockup card with blue tilted background wrapper */}
        <div className="lg:col-span-6 relative flex justify-center lg:justify-end py-6">
          {/* Background decorative grid */}
          <div className="absolute -top-6 -right-6 h-36 w-36 bg-grid-pattern opacity-10 select-none pointer-events-none" />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="relative w-full max-w-[440px]"
          >
            {/* Tilted Blue Backdrop (Matching application primary blue theme) */}
            <div className="absolute inset-0 bg-blue-600 rounded-[36px] transform rotate-3 scale-[1.02] shadow-xl shadow-blue-500/10 pointer-events-none" />
            
            {/* White Form Card (Matching the user's uploaded mockup style exactly) */}
            <div className="relative bg-white rounded-[32px] shadow-2xl p-7 border border-gray-200/60 flex flex-col justify-between min-h-[470px]">
              <div>
                {/* Question status */}
                <div className="flex items-center gap-1.5 text-gray-400 text-[10px] font-bold select-none uppercase tracking-wider">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                  Question 2 of 6
                </div>

                {/* Arrow identifier */}
                <div className="text-xs font-bold text-blue-600 flex items-center gap-1 mt-4">
                  2 →
                </div>

                {/* Heading */}
                <h3 className="text-xl font-bold text-gray-900 leading-tight mt-1">
                  What best describes your team?
                </h3>

                {/* Subtitle */}
                <p className="text-xs text-gray-400 font-semibold mt-1">
                  Pick one — <span className="text-gray-500 font-medium">you can change this later.</span>
                </p>

                {/* Options List */}
                <div className="space-y-1.5 mt-5">
                  {[
                    { key: "A", label: "Marketing" },
                    { key: "B", label: "Sales" },
                    { key: "C", label: "Product" },
                    { key: "D", label: "HR / People" },
                    { key: "E", label: "Something else" }
                  ].map((choice) => (
                    <button
                      key={choice.key}
                      onClick={() => setActiveQuestionChoice(choice.key)}
                      className={`w-full text-left px-3.5 py-2.5 rounded-xl border text-xs font-bold flex items-center transition-all ${
                        activeQuestionChoice === choice.key
                          ? "border-blue-600 bg-blue-50/20 text-blue-600 shadow-2xs"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50/30 bg-white text-gray-700"
                      }`}
                    >
                      <span className={`h-5 w-5 rounded-md flex items-center justify-center font-bold text-[9px] border mr-3 shrink-0 ${
                        activeQuestionChoice === choice.key
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-gray-50 text-gray-400 border-gray-200"
                      }`}>
                        {choice.key}
                      </span>
                      {choice.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* OK and Press Enter CTA */}
              <div className="flex items-center gap-3 mt-6 pt-4 border-t border-gray-100">
                <button
                  onClick={() => alert("Form submission simulated successfully!")}
                  className="px-5 py-2.5 bg-[#26212e] text-white hover:bg-[#342d3e] text-[11px] font-bold rounded-lg flex items-center gap-1.5 shadow-sm transition-colors"
                >
                  OK <span className="text-[10px]">✓</span>
                </button>
                <span className="text-[10px] text-gray-400 font-semibold flex items-center gap-1 select-none">
                  press <span className="bg-gray-150 border border-gray-200 rounded px-1.5 py-0.5 text-gray-500 font-mono text-[9px]">Enter</span>
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 3. LOGO WALL SECTION */}
      <section className="border-t border-b border-gray-200/50 bg-[#f8f9fa] py-8 text-center px-6 select-none">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Trusted by teams at</span>
        <div className="flex flex-wrap justify-center items-center gap-10 lg:gap-16 mt-4 opacity-50 grayscale hover:grayscale-0 transition-all duration-300">
          <div className="flex items-center gap-1.5 font-extrabold text-sm text-gray-600">
            <span>⬢</span> Acme Corp
          </div>
          <div className="flex items-center gap-1.5 font-extrabold text-sm text-gray-600">
            <span>❖</span> RiseUp
          </div>
          <div className="flex items-center gap-1.5 font-extrabold text-sm text-gray-600">
            <span>⬟</span> Velocity
          </div>
          <div className="flex items-center gap-1.5 font-extrabold text-sm text-gray-600">
            <span>★</span> SnapShot
          </div>
          <div className="flex items-center gap-1.5 font-extrabold text-sm text-gray-600">
            <span>≋</span> Oceanic
          </div>
        </div>
      </section>

      {/* 4. INTERACTIVE DEMO SHOWCASE SECTION */}
      <section id="demo-showcase" className="py-20 px-6 lg:px-16 max-w-7xl mx-auto space-y-12">
        <div className="text-center max-w-xl mx-auto space-y-3">
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Explore the Platform</h2>
          <p className="text-sm text-gray-500 font-medium leading-relaxed">
            Take a look at how you build, preview, and review analytics using the existing workspaces interface.
          </p>
        </div>

        {/* Tab switch buttons */}
        <div className="flex justify-center border-b border-gray-200">
          <div className="flex gap-6 text-xs font-bold">
            {[
              { id: "builder", label: "Form Builder" },
              { id: "preview", label: "Mobile Preview" },
              { id: "results", label: "Analytics Summary" },
              { id: "responses", label: "Responses Grid" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setDemoTab(tab.id as any)}
                className={`pb-3 border-b-2 font-bold transition-all px-2 ${
                  demoTab === tab.id
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-400 hover:text-gray-600"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Canvas Mockup */}
        <div className="bg-white rounded-3xl border border-gray-200/80 shadow-lg p-6 min-h-[350px] flex items-center justify-center">
          {demoTab === "builder" && (
            <div className="w-full max-w-3xl space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                  <span className="text-blue-500">🛠️</span> Question Flow Builder
                </h4>
                <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-bold">Workspace Active</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 border border-blue-100 bg-blue-50/10 rounded-xl space-y-2 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-600">Question 1: Multiple Choice</span>
                    <span className="text-[9px] bg-blue-100 text-blue-700 rounded px-1 font-bold">Required</span>
                  </div>
                  <h5 className="text-xs font-bold text-gray-800">What is your primary goal?</h5>
                  <p className="text-[10px] text-gray-400">Options: Learn, Build forms, Integrate, Other</p>
                </div>
                <div className="p-4 border border-gray-150 rounded-xl space-y-2 text-left">
                  <span className="text-xs font-bold text-gray-500">Question 2: Long Text</span>
                  <h5 className="text-xs font-bold text-gray-800">Describe your product vision.</h5>
                  <p className="text-[10px] text-gray-400">Placeholder: Start typing here...</p>
                </div>
                <div className="p-4 border border-gray-150 rounded-xl space-y-2 text-left">
                  <span className="text-xs font-bold text-gray-500">Question 3: Email Input</span>
                  <h5 className="text-xs font-bold text-gray-800">Enter your email address.</h5>
                  <p className="text-[10px] text-gray-400">Placeholder: name@domain.com</p>
                </div>
                <div className="p-4 border border-dashed border-gray-300 hover:border-gray-400 rounded-xl flex items-center justify-center text-xs font-bold text-gray-400 hover:text-gray-600 cursor-pointer transition-colors min-h-[90px]">
                  + Add Question Card
                </div>
              </div>
            </div>
          )}

          {demoTab === "preview" && (
            <div className="w-full max-w-[280px] h-[450px] border-[6px] border-gray-900 rounded-[32px] overflow-hidden bg-white shadow-2xl relative flex flex-col justify-between p-4">
              <div className="h-1.5 w-24 bg-gray-900 rounded-full mx-auto mb-4 select-none shrink-0" />
              
              <div className="flex-1 flex flex-col justify-center space-y-4 my-auto px-2">
                <span className="text-[8px] font-bold text-blue-500 tracking-wider">PREVIEW MODE</span>
                <h4 className="text-xs font-bold text-gray-800">Are you satisfied with our services?</h4>
                <div className="space-y-2">
                  <button className="w-full text-left px-3 py-2 border border-gray-200 bg-white text-[10px] rounded-lg font-semibold text-gray-600 hover:border-blue-600 hover:bg-blue-50/20">
                    A. Very Satisfied
                  </button>
                  <button className="w-full text-left px-3 py-2 border border-gray-200 bg-white text-[10px] rounded-lg font-semibold text-gray-600 hover:border-blue-600 hover:bg-blue-50/20">
                    B. Satisfied
                  </button>
                  <button className="w-full text-left px-3 py-2 border border-gray-200 bg-white text-[10px] rounded-lg font-semibold text-gray-600 hover:border-blue-600 hover:bg-blue-50/20">
                    C. Unsatisfied
                  </button>
                </div>
              </div>

              <div className="h-1 w-16 bg-gray-900 rounded-full mx-auto mt-4 select-none shrink-0" />
            </div>
          )}

          {demoTab === "results" && (
            <div className="w-full max-w-2xl space-y-5 text-left">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h4 className="text-sm font-bold text-gray-800">Form Analytics Dashboard</h4>
                <span className="text-xs font-bold text-gray-400">Total Views: 154</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 border border-gray-150 rounded-2xl bg-[#f8f9fa]">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Total Responses</span>
                  <h3 className="text-2xl font-black text-gray-800 mt-1">42</h3>
                </div>
                <div className="p-4 border border-gray-150 rounded-2xl bg-[#f8f9fa]">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Completion Rate</span>
                  <h3 className="text-2xl font-black text-gray-800 mt-1">87.5%</h3>
                </div>
                <div className="p-4 border border-gray-150 rounded-2xl bg-[#f8f9fa]">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Average Time</span>
                  <h3 className="text-2xl font-black text-gray-800 mt-1">1m 14s</h3>
                </div>
              </div>

              <div className="p-4 border border-gray-150 rounded-2xl space-y-3">
                <h5 className="text-xs font-bold text-gray-800">Completion Trends</h5>
                <div className="h-12 w-full flex items-end gap-2 pt-2">
                  <div className="w-full h-[20%] bg-blue-100 rounded-sm" />
                  <div className="w-full h-[40%] bg-blue-100 rounded-sm" />
                  <div className="w-full h-[35%] bg-blue-100 rounded-sm" />
                  <div className="w-full h-[65%] bg-blue-100 rounded-sm" />
                  <div className="w-full h-[85%] bg-blue-600 rounded-sm" />
                  <div className="w-full h-[70%] bg-blue-600 rounded-sm" />
                  <div className="w-full h-[95%] bg-blue-600 rounded-sm" />
                </div>
              </div>
            </div>
          )}

          {demoTab === "responses" && (
            <div className="w-full max-w-3xl overflow-hidden border border-gray-150 rounded-2xl text-left">
              <table className="w-full text-xs">
                <thead className="bg-[#f8f9fa] border-b border-gray-150 font-bold text-gray-500">
                  <tr>
                    <th className="px-4 py-2.5">Responder</th>
                    <th className="px-4 py-2.5">Email</th>
                    <th className="px-4 py-2.5">Completed</th>
                    <th className="px-4 py-2.5 text-right">Time Taken</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                  <tr>
                    <td className="px-4 py-3">Anonymous A</td>
                    <td className="px-4 py-3">a***@study.iitm.ac.in</td>
                    <td className="px-4 py-3 text-green-600">Yes</td>
                    <td className="px-4 py-3 text-right">45s</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3">Anonymous B</td>
                    <td className="px-4 py-3">b***@study.iitm.ac.in</td>
                    <td className="px-4 py-3 text-green-600">Yes</td>
                    <td className="px-4 py-3 text-right">1m 20s</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3">Anonymous C</td>
                    <td className="px-4 py-3">c***@study.iitm.ac.in</td>
                    <td className="px-4 py-3 text-red-500">No (Dropped)</td>
                    <td className="px-4 py-3 text-right">22s</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* 5. CALL TO ACTION SECTION */}
      <section className="bg-blue-550 py-16 px-6 text-center select-none bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-t-[40px] sm:rounded-t-[80px]">
        <div className="max-w-xl mx-auto space-y-6">
          <h2 className="text-3xl font-extrabold tracking-tight">Ready to build your first form?</h2>
          <p className="text-sm text-blue-100 leading-relaxed font-medium">
            Join other students and developers using FormNest to capture workspace submissions cleanly.
          </p>
          <div className="flex justify-center gap-4 pt-2">
            <Link
              href="/signup"
              className="px-6 py-3 bg-white text-blue-600 hover:bg-blue-50 rounded-xl text-sm font-bold shadow-sm transition-all"
            >
              Get Started
            </Link>
            <Link
              href="/login"
              className="px-6 py-3 bg-blue-800 text-white border border-blue-900/50 hover:bg-blue-800/80 rounded-xl text-sm font-bold shadow-xs transition-all"
            >
              Login
            </Link>
          </div>
        </div>
      </section>

      {/* 6. MINIMAL FOOTER */}
      <footer className="bg-[#fafafb] border-t border-gray-200/50 py-8 px-6 lg:px-16 flex flex-col sm:flex-row items-center justify-between gap-4 font-semibold text-xs text-gray-400">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded bg-[#262626] text-white flex items-center justify-center font-bold text-xs select-none">
            2
          </div>
          <span className="text-gray-900 font-bold">FormNest</span>
        </div>

        <div className="flex items-center gap-6">
          <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-gray-600 transition-colors">GitHub</a>
          <span className="hover:text-gray-600 cursor-pointer transition-colors">Privacy</span>
          <span className="hover:text-gray-600 cursor-pointer transition-colors">Terms</span>
        </div>

        <div>
          © {new Date().getFullYear()} FormNest. All rights reserved.
        </div>
      </footer>

    </div>
  );
}