"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import ResultsLayout from "@/components/results/ResultsLayout";

export default function ResultsRouteLayout({ children }: { children: React.ReactNode }) {
  const params = useParams<{ formId: string }>();
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

  return <ResultsLayout formId={formId}>{children}</ResultsLayout>;
}
