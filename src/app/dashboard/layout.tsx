"use client"

import { NavMain } from "@/components/dashboard/nav-main"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { GraduationCap, LogOut, Bell } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useAuth } from "@/firebase"
import { useUserRole } from "@/hooks/use-user-role"
import { useAuthGuard } from "@/hooks/use-auth-guard"
import { logoutUser } from "@/lib/auth/auth-service"
import { Badge } from "@/components/ui/badge"
import { FirebaseClientProvider } from "@/firebase/client-provider"

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const auth = useAuth()
  const { user, profile, isTeacher, loading } = useUserRole()
  const { isUserLoading } = useAuthGuard() // Redirects to /login if not signed in

  // Show a full-screen spinner while Firebase resolves auth state
  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm font-body">Loading your workspace…</p>
        </div>
      </div>
    )
  }

  const handleLogout = async () => {
    if (auth) {
      await logoutUser(auth)
      router.push("/login")
    }
  }

  const displayName = profile?.displayName || user?.displayName || user?.email?.split("@")[0] || "Guest User"
  const email = profile?.email || user?.email || ""
  const initials = displayName.slice(0, 2).toUpperCase()

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader className="h-16 flex items-center px-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary p-2 rounded-lg">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-headline font-bold text-primary group-data-[collapsible=icon]:hidden">
              Recovery Engine
            </span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <NavMain />
        </SidebarContent>
        <SidebarFooter className="p-4">
          <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
            <Avatar className="h-9 w-9 border border-sidebar-border">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col group-data-[collapsible=icon]:hidden min-w-0">
              <span className="text-sm font-medium truncate">{displayName}</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Badge variant={isTeacher ? "default" : "secondary"} className="text-[10px] px-1.5 py-0">
                  {isTeacher ? "Teacher" : "Student"}
                </Badge>
              </div>
            </div>
          </div>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex-1">
            <h1 className="text-lg font-headline font-semibold">
              {isTeacher ? "Teacher Dashboard" : "Student Portal"}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-accent rounded-full border-2 border-background"></span>
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout} title="Sign Out">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-6 bg-background">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <DashboardLayoutContent>
      {children}
    </DashboardLayoutContent>
  )
}
