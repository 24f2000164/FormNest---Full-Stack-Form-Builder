"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { googleAuthLogin } from "@/lib/api";

declare global {
  interface Window {
    google?: any;
  }
}

interface GoogleOAuthButtonProps {
  mode: "login" | "signup";
  onError?: (err: string) => void;
}

export default function GoogleOAuthButton({ mode, onError }: GoogleOAuthButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const buttonContainerRef = useRef<HTMLDivElement>(null);

  const clientId =
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    "473812174692-fvvrtqvmbqc34fibajf8o0a73utmpaba.apps.googleusercontent.com";

  useEffect(() => {
    let isMounted = true;

    const handleCredentialResponse = async (response: any) => {
      if (!response.credential) return;

      if (isMounted) {
        setLoading(true);
        setError(null);
      }

      try {
        const authRes = await googleAuthLogin(response.credential);

        localStorage.setItem("user_authenticated", "true");
        localStorage.setItem("user_id", authRes.user.id.toString());
        localStorage.setItem("user_email", authRes.user.email);
        localStorage.setItem("user_name", authRes.user.name);
        localStorage.removeItem("dashboard_selected_workspace_id");

        router.push("/dashboard");
      } catch (err: any) {
        const msg = err.message || "Google authentication failed. Please try again.";
        if (isMounted) {
          setError(msg);
          setLoading(false);
        }
        if (onError) onError(msg);
      }
    };

    const initializeGoogleSignIn = () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        if (buttonContainerRef.current) {
          buttonContainerRef.current.innerHTML = "";
          window.google.accounts.id.renderButton(buttonContainerRef.current, {
            theme: "outline",
            size: "large",
            type: "standard",
            shape: "pill",
            text: mode === "signup" ? "signup_with" : "signin_with",
            logo_alignment: "left",
            width: "380",
          });
        }
      }
    };

    // Check if script is already present
    if (window.google?.accounts?.id) {
      initializeGoogleSignIn();
    } else {
      const existingScript = document.getElementById("google-gsi-script");
      if (!existingScript) {
        const script = document.createElement("script");
        script.id = "google-gsi-script";
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        script.onload = () => {
          initializeGoogleSignIn();
        };
        document.head.appendChild(script);
      } else {
        existingScript.addEventListener("load", initializeGoogleSignIn);
      }
    }

    return () => {
      isMounted = false;
    };
  }, [clientId, mode, router, onError]);

  const handleCustomClick = () => {
    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
    } else {
      setError("Google Sign-In is initializing. Please try again in a moment.");
    }
  };

  return (
    <div className="w-full flex flex-col items-center gap-2">
      {/* Official Google GSI Button Container */}
      <div
        ref={buttonContainerRef}
        className="w-full flex justify-center items-center min-h-[44px]"
      >
        {/* Fallback styled button while script loads */}
        <button
          type="button"
          onClick={handleCustomClick}
          disabled={loading}
          className="w-full h-11 border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-3 shadow-xs"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.3 7.31 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.17 0 9.97 0 12s.46 3.83 1.26 5.42l4.02-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.7 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
          <span>{loading ? "Connecting to Google..." : `Continue with Google`}</span>
        </button>
      </div>

      {error && (
        <p className="text-[10px] text-red-600 font-bold text-center mt-1">
          ⚠️ {error}
        </p>
      )}
    </div>
  );
}
