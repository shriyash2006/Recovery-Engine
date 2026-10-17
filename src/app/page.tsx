"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, GraduationCap, ShieldCheck, Terminal } from 'lucide-react';

export default function Home() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  // If user is already authenticated (or just returned from Google OAuth redirect), forward to dashboard
  useEffect(() => {
    if (!isUserLoading && user) {
      router.replace('/dashboard');
    }
  }, [user, isUserLoading, router]);

  // While checking auth status or actively forwarding a logged-in user
  if (isUserLoading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="bg-primary p-3 rounded-2xl shadow-lg animate-pulse">
            <GraduationCap className="h-10 w-10 text-primary-foreground" />
          </div>
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm font-body text-muted-foreground">
            {user ? "Redirecting to your dashboard..." : "Loading Recovery Engine..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 sm:p-8">
      <div className="max-w-4xl w-full space-y-8">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="bg-primary p-3 rounded-2xl shadow-lg">
              <GraduationCap className="h-10 w-10 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-4xl sm:text-6xl font-headline font-bold text-primary tracking-tight">
            Missed Class Recovery Engine
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-body">
            Empowering students with AI-driven lecture recovery. Never miss a beat in your learning journey.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
          <Card className="border-none shadow-xl hover:shadow-2xl transition-shadow bg-card">
            <CardHeader>
              <ShieldCheck className="h-8 w-8 text-accent mb-2" />
              <CardTitle className="font-headline">Teacher Portal</CardTitle>
              <CardDescription>Manage classes, add/remove students, and mark attendance.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full bg-primary hover:bg-primary/90">
                <Link href="/login">Teacher Login</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl hover:shadow-2xl transition-shadow bg-card">
            <CardHeader>
              <BookOpen className="h-8 w-8 text-accent mb-2" />
              <CardTitle className="font-headline">Student Portal</CardTitle>
              <CardDescription>View lecture plans, schedule, and missed class summaries.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full bg-primary hover:bg-primary/90">
                <Link href="/login">Student Login</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl hover:shadow-2xl transition-shadow bg-card">
            <CardHeader>
              <Terminal className="h-8 w-8 text-accent mb-2" />
              <CardTitle className="font-headline">Developer</CardTitle>
              <CardDescription>Access system logs and development tools.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full border-primary text-primary hover:bg-primary/5">
                <Link href="/developer">Dev Portal</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <footer className="text-center pt-12 text-sm text-muted-foreground font-body">
          &copy; {new Date().getFullYear()} Recovery Engine. All rights reserved.
        </footer>
      </div>
    </div>
  );
}
