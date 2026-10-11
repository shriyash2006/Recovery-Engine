"use client";

/**
 * useAuthGuard — Redirects unauthenticated users to /login.
 *
 * WHY: Next.js App Router has no built-in auth middleware for client components.
 * We use this hook at the layout level so every dashboard sub-page is protected
 * without copy-pasting the redirect logic in each page file.
 *
 * HOW: onAuthStateChanged fires once when Firebase initialises. While loading
 * (isUserLoading = true) we show nothing. Once resolved, if user is null we push
 * to /login. Otherwise the children render normally.
 *
 * TRADE-OFF: This is client-side protection — the HTML shell can technically be
 * fetched before the redirect fires. For real server-side auth guards use Next.js
 * middleware with a session cookie (e.g. Firebase Admin SDK). For this project
 * client-side is sufficient because Firestore rules enforce all data access.
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/firebase";

export function useAuthGuard() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isUserLoading) return; // Wait for Firebase to resolve auth state
    if (!user) {
      router.replace("/login"); // replace() so the back button doesn't return to /dashboard
    }
  }, [user, isUserLoading, router]);

  return { user, isUserLoading };
}
