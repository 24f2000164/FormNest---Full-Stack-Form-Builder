"use client";

import { motion } from "framer-motion";
import { CloseIcon } from "./icons";

// Renders the QR as an <img> from a public QR-image endpoint rather than
// pulling in a QR-generation package - no new install needed, and the
// image request only ever contains the form's already-public share URL.
function qrImageUrl(publicUrl: string) {
  const size = 220;
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(publicUrl)}`;
}

export default function QrCodeModal({
  publicUrl,
  onClose,
}: {
  publicUrl: string;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xs rounded-2xl bg-white p-6 text-center shadow-xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Scan to open</h3>
          <button onClick={onClose} aria-label="Close" className="text-gray-400 hover:text-gray-700">
            <CloseIcon />
          </button>
        </div>
        <img
          src={qrImageUrl(publicUrl)}
          alt="QR code for this form's public link"
          className="mx-auto h-[220px] w-[220px] rounded-lg border"
        />
        <p className="mt-4 break-all text-xs text-gray-500">{publicUrl}</p>
      </motion.div>
    </div>
  );
}
