"use client";

/**
 * RoleGuard — Blocks a page from rendering if the signed-in user
 * does not have one of the allowed roles.
 *
 * Usage:
 *   <RoleGuard allowedRoles={["teacher", "professor"]}>
 *     <AttendancePage />
 *   </RoleGuard>
 *
 * WHY: The sidebar already hides links for students, but a user could still
 * manually navigate to a URL. This component adds a second layer of UI
 * protection (Firestore Rules are the authoritative third layer).
 *
 * WHAT: Shows a full-page "Access Denied" card while loading, or when the
 * role doesn't match. Students see a clear explanation and a link back to
 * the planner (their primary page).
 */

import React from "react";
import Link from "next/link";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUserRole } from "@/hooks/use-user-role";
import { UserRole } from "@/lib/auth/auth-service";

interface RoleGuardProps {
  /** The roles that are allowed to see the children. */
  allowedRoles: UserRole[];
  children: React.ReactNode;
}

export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const { role, loading } = useUserRole();

  // While Firebase / Firestore is resolving, show a subtle loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm font-body">Verifying permissions…</p>
        </div>
      </div>
    );
  }

  const hasAccess = allowedRoles.includes(role);

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-6">
        <Card className="w-full max-w-md border-none shadow-lg text-center">
          <CardHeader className="pb-3">
            <div className="flex justify-center mb-4">
              <div className="p-4 rounded-full bg-destructive/10 text-destructive">
                <ShieldAlert className="h-10 w-10" />
              </div>
            </div>
            <CardTitle className="text-2xl font-headline text-primary">
              Access Restricted
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground font-body text-sm leading-relaxed">
              This page is only accessible to{" "}
              <strong>{allowedRoles.join(" / ")}</strong> accounts.
              Your current role is <strong>{role}</strong>.
            </p>
            <p className="text-xs text-muted-foreground font-body">
              If you believe this is a mistake, please contact your instructor.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Button asChild variant="outline" className="gap-2 font-body">
                <Link href="/dashboard">
                  <ArrowLeft className="h-4 w-4" /> Go to Overview
                </Link>
              </Button>
              <Button asChild className="gap-2 font-body bg-primary hover:bg-primary/90">
                <Link href="/dashboard/planner">
                  View Class Schedule
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
