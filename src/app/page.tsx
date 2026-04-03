import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, GraduationCap, ShieldCheck, Terminal } from 'lucide-react';

export default function Home() {
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
            Ascent Scholar
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
              <CardDescription>Manage classes, attendance, and study materials.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full bg-primary hover:bg-primary/90">
                <Link href="/dashboard">Teacher Login</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl hover:shadow-2xl transition-shadow bg-card">
            <CardHeader>
              <BookOpen className="h-8 w-8 text-accent mb-2" />
              <CardTitle className="font-headline">Admin Portal</CardTitle>
              <CardDescription>Configure system settings and manage courses.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full bg-primary hover:bg-primary/90">
                <Link href="/dashboard">Admin Login</Link>
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
          &copy; {new Date().getFullYear()} Ascent Scholar Recovery Engine. All rights reserved.
        </footer>
      </div>
    </div>
  );
}
