"use client";

import { useEffect, useState } from "react";
import { useUser, useFirestore } from "@/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { UserProfile, UserRole } from "@/lib/auth/auth-service";

export function useUserRole() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isUserLoading) return;
    if (!user || !db) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const userRef = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(
      userRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setProfile(snapshot.data() as UserProfile);
        } else {
          // Fallback default profile if not written yet
          setProfile({
            id: user.uid,
            email: user.email || "",
            displayName: user.displayName || user.email?.split("@")[0] || "User",
            role: "student",
          });
        }
        setLoading(false);
      },
      (err) => {
        console.warn("useUserRole: could not load profile from Firestore, using default profile fallback:", err);
        setProfile({
          id: user.uid,
          email: user.email || "",
          displayName: user.displayName || user.email?.split("@")[0] || "User",
          role: "teacher",
        });
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, isUserLoading, db]);

  const role: UserRole = profile?.role || "student";
  const isTeacher = role === "teacher" || role === "professor";
  const isStudent = role === "student";

  return {
    user,
    profile,
    role,
    isTeacher,
    isStudent,
    loading: isUserLoading || loading,
  };
}
