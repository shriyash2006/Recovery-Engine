"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GraduationCap, ShieldCheck, BookOpen, AlertCircle, ArrowRight } from "lucide-react";
import { useAuth, useFirestore, useUser } from "@/firebase";
import { loginWithEmail, registerWithEmail, loginWithGoogle, handleGoogleRedirectResult, UserRole } from "@/lib/auth/auth-service";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const router = useRouter();
  const auth = useAuth();
  const db = useFirestore();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [role, setRole] = useState<UserRole>("teacher");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  // If already signed in, forward immediately to dashboard
  useEffect(() => {
    if (!isUserLoading && user) {
      router.replace("/dashboard");
    }
  }, [user, isUserLoading, router]);

  // Handle redirect result after signInWithRedirect (fallback for popup failures)
  useEffect(() => {
    if (!auth || !db) return;
    handleGoogleRedirectResult(auth, db, role).then((result) => {
      if (result) {
        toast({
          title: "Signed In with Google",
          description: "Welcome to Recovery Engine.",
        });
        router.replace("/dashboard");
      }
    }).catch((err) => {
      console.error("Redirect result error:", err);
    });
  }, [auth, db]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !db) {
      toast({
        variant: "destructive",
        title: "Firebase not ready",
        description: "Please check your network and refresh the page.",
      });
      return;
    }

    setLoading(true);
    try {
      if (mode === "signin") {
        await loginWithEmail(auth, db, email, password);
        toast({
          title: "Welcome back!",
          description: "Signed in successfully.",
        });
      } else {
        await registerWithEmail(auth, db, email, password, name || email.split("@")[0], role);
        toast({
          title: "Account Created",
          description: `Registered as ${role === "teacher" ? "Teacher / Professor" : "Student"}.`,
        });
      }
      router.push("/dashboard");
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Authentication Failed",
        description: err.message || "Could not complete sign in.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!auth || !db) return;
    setLoading(true);
    try {
      const res = await loginWithGoogle(auth, db, role);
      if ('redirected' in res && res.redirected) {
        // Full page redirect initiated; keep loading spinner active while browser navigates
        return;
      }
      if ('user' in res && res.user) {
        toast({
          title: "Signed In with Google",
          description: "Welcome to Recovery Engine.",
        });
        router.push("/dashboard");
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Google Sign-In Failed",
        description: err.message || "Failed to authenticate with Google.",
      });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md shadow-xl border-none">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <div className="bg-primary/10 p-3 rounded-2xl text-primary">
              <GraduationCap className="h-8 w-8" />
            </div>
          </div>
          <CardTitle className="text-2xl font-headline font-bold">
            {mode === "signin" ? "Sign In to Recovery Engine" : "Create an Account"}
          </CardTitle>
          <CardDescription>
            AI-driven attendance recovery and class management
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Mode switch (Sign in vs Register) */}
          <div className="flex border-b">
            <button
              type="button"
              onClick={() => setMode("signin")}
              className={`flex-1 pb-3 text-sm font-medium border-b-2 transition-colors ${mode === "signin"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`flex-1 pb-3 text-sm font-medium border-b-2 transition-colors ${mode === "signup"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
            >
              Create Account
            </button>
          </div>

          {/* Role selector (Teacher vs Student) */}
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Select Your Role</Label>
            <Tabs value={role} onValueChange={(val) => setRole(val as UserRole)} className="w-full">
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="teacher" className="gap-2">
                  <ShieldCheck className="h-4 w-4" /> Teacher / Prof
                </TabsTrigger>
                <TabsTrigger value="student" className="gap-2">
                  <BookOpen className="h-4 w-4" /> Student
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Role permission preview box */}
          <div className="p-3 rounded-lg bg-primary/5 text-xs text-muted-foreground border border-primary/10 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <div>
              {role === "teacher" ? (
                <span>
                  <strong>Teacher privileges:</strong> Create classes, add/remove students, schedule lecture topics, and mark attendance to send recovery emails.
                </span>
              ) : (
                <span>
                  <strong>Student privileges:</strong> Read-only access to lecture planner, next class schedules, study materials, and personal recaps.
                </span>
              )}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-1.5">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="e.g. Dr. Jane Smith"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full gap-2 font-headline">
              {loading ? "Processing..." : mode === "signin" ? "Sign In" : "Register"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={handleGoogleSignIn}
            className="w-full border-primary/20 hover:bg-primary/5"
          >
            Google Sign-In
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
