"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export default function FeedbackModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [feedbackType, setFeedbackType] = useState("general");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    // Mock API delay
    await new Promise((resolve) => setTimeout(resolve, 800));
    setSubmitting(false);
    setSuccess(true);
    // Reset form fields
    setName("");
    setEmail("");
    setRating(null);
    setFeedbackType("general");
    setMessage("");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-60 flex items-center justify-center p-4">
          {/* Modal Card Backdrop click close */}
          <div className="absolute inset-0" onClick={onClose} />
          
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-150 overflow-hidden flex flex-col relative z-10 text-left text-gray-800"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900">Give Feedback</h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors text-sm"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {success ? (
                <div className="text-center py-6 space-y-4">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-50 text-green-600">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h4 className="text-sm font-bold text-gray-900">Thank you!</h4>
                  <p className="text-xs text-gray-450 font-semibold leading-relaxed">
                    Your feedback has been successfully submitted. We appreciate your thoughts on improving FormNest!
                  </p>
                  <button
                    onClick={() => {
                      setSuccess(false);
                      onClose();
                    }}
                    className="mt-2 px-4 py-2 bg-gray-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Name and Email */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide">Name</label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Sahil Kumar"
                        className="w-full border border-gray-250 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-gray-400 focus:bg-white bg-white font-semibold text-gray-700"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide">Email</label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="sahil@example.com"
                        className="w-full border border-gray-250 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-gray-400 focus:bg-white bg-white font-semibold text-gray-700"
                      />
                    </div>
                  </div>

                  {/* Feedback Type */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide">Feedback Type</label>
                    <div className="flex border border-gray-250 rounded-lg p-0.5 w-full bg-gray-50/60 font-semibold select-none text-[10px]">
                      {(["general", "bug", "feature"] as const).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setFeedbackType(type)}
                          className={`flex-1 py-1 rounded-md transition-all uppercase tracking-wider ${
                            feedbackType === type
                              ? "bg-white text-gray-800 border border-gray-200 shadow-2xs font-bold"
                              : "text-gray-450 hover:text-gray-700"
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Rating Selector */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide">Rate your experience</label>
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className="text-lg transition-transform duration-100 hover:scale-125 select-none"
                        >
                          {rating !== null && rating >= star ? "★" : "☆"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Message */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide">Your Message</label>
                    <textarea
                      required
                      rows={3}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="What is on your mind?..."
                      className="w-full border border-gray-250 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-gray-400 focus:bg-white bg-white font-semibold text-gray-700 resize-none"
                    />
                  </div>

                  {/* Footer Action buttons */}
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 hover:bg-gray-100 text-gray-500 rounded-xl text-xs font-bold transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-4 py-2 bg-gray-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-50"
                    >
                      {submitting ? "Submitting..." : "Submit Feedback"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
