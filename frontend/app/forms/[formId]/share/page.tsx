"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { getShareInfo, ShareInfo } from "@/lib/api";
import ShareHeader from "@/components/share/ShareHeader";
import ShareTransitionOverlay from "@/components/share/ShareTransitionOverlay";
import CopyLinkBar from "@/components/share/CopyLinkBar";
import LinkPreviewCard from "@/components/share/LinkPreviewCard";
import EmbedSection from "@/components/share/EmbedSection";
import QrCodeModal from "@/components/share/QrCodeModal";
import Toast from "@/components/share/Toast";

// How long the entrance overlay (components/share/ShareTransitionOverlay)
// stays mounted before revealing the page underneath. Kept inside the
// 500-700ms window from the spec.
const TRANSITION_MS = 650;

export default function SharePage() {
  const params = useParams();
  const formId = params.formId as string;
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isAuth = localStorage.getItem("user_authenticated") === "true";
      if (!isAuth) {
        router.push("/login");
      }
    }
  }, [router]);

  const [shareInfo, setShareInfo] = useState<ShareInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");

  const [transitioning, setTransitioning] = useState(true);
  const [showQr, setShowQr] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") setOrigin(window.location.origin);
    const t = setTimeout(() => setTransitioning(false), TRANSITION_MS);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!formId) return;
    getShareInfo(Number(formId))
      .then(setShareInfo)
      .catch(() => setError("Couldn't load this form's share settings."))
      .finally(() => setLoading(false));
  }, [formId]);

  function flashToast(message: string) {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage((m) => (m === message ? null : m)), 2200);
  }

  return (
    <div className="relative min-h-screen bg-white">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: transitioning ? 0 : 1 }}
        transition={{ duration: 0.4, delay: 0.25, ease: "easeOut" }}
      >
        <ShareHeader formId={formId} title={shareInfo?.title || ""} />

        <main className="mx-auto max-w-2xl px-4 pb-24 pt-20">
          {loading ? (
            <p className="text-center text-sm text-gray-400">Loading...</p>
          ) : error || !shareInfo ? (
            <p className="text-center text-sm text-gray-500">{error || "Form not found."}</p>
          ) : (
            <>
              <h1 className="mb-8 text-center text-2xl font-semibold text-gray-900 sm:text-[28px]">
                Choose how you&apos;d like to share your form
              </h1>

              <div className="rounded-2xl border bg-white p-6 shadow-sm">
                <CopyLinkBar
                  formId={shareInfo.id}
                  shareInfo={shareInfo}
                  origin={origin}
                  onSlugUpdated={setShareInfo}
                  onCopied={() => flashToast("Link copied")}
                  onOpenQr={() => setShowQr(true)}
                />
                <LinkPreviewCard title={shareInfo.title} description={shareInfo.description} origin={origin} />
              </div>

              <EmbedSection onComingSoon={() => flashToast("Coming soon")} />

              <div className="mt-8 flex justify-center">
                <button
                  onClick={() => flashToast("Coming soon")}
                  className="rounded-full border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Explore other ways to share
                </button>
              </div>
            </>
          )}
        </main>
      </motion.div>

      <AnimatePresence>{transitioning && <ShareTransitionOverlay key="overlay" />}</AnimatePresence>

      {showQr && shareInfo && (
        <QrCodeModal publicUrl={`${origin}/f/${shareInfo.slug}`} onClose={() => setShowQr(false)} />
      )}

      <Toast message={toastMessage} />
    </div>
  );
}
