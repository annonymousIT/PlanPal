"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { saveTokens } from "@/lib/api";

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const accessToken = searchParams.get("access_token");
    const refreshToken = searchParams.get("refresh_token");
    if (accessToken && refreshToken) {
      saveTokens(accessToken, refreshToken);
    }
    router.replace("/");
  }, [searchParams, router]);

  return (
    <div className="h-screen flex items-center justify-center bg-white dark:bg-slate-950">
      <div className="flex items-center gap-3">
        <div className="w-5 h-5 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-slate-500 text-sm">ログイン中...</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense>
      <CallbackHandler />
    </Suspense>
  );
}
