"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, BookOpen, CheckSquare, Mail, ArrowUpRight, ArrowDownRight, Calendar, Sparkles, Clock, MapPin } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useUserRole } from "@/hooks/use-user-role"

// ─── Teacher Dashboard Overview ─────────────────────────────────────────────
function TeacherOverview({ displayName }: { displayName: string }) {
  const stats = [
    {
      title: "Total Students",
      value: "1,284",
      icon: Users,
      trend: "+4.2%",
      trendUp: true,
      description: "Across 12 active courses"
    },
    {
      title: "Active Courses",
      value: "12",
      icon: BookOpen,
      trend: "0%",
      trendUp: true,
      description: "Current Semester"
    },
    {
      title: "Avg. Attendance",
      value: "84%",
      icon: CheckSquare,
      trend: "-2.1%",
      trendUp: false,
      description: "Last 7 days"
    },
    {
      title: "Summaries Sent",
      value: "3,412",
      icon: Mail,
      trend: "+12.5%",
      trendUp: true,
      description: "AI-generated recoveries"
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-headline font-bold text-primary">Overview</h2>
        <p className="text-muted-foreground font-body">
          Welcome back, {displayName}. Here&apos;s what&apos;s happening today.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-headline">{stat.value}</div>
              <div className="flex items-center gap-1 pt-1">
                {stat.trendUp ? (
                  <ArrowUpRight className="h-3 w-3 text-green-500" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 text-red-500" />
                )}
                <span className={`text-xs font-medium ${stat.trendUp ? 'text-green-500' : 'text-red-500'}`}>
                  {stat.trend}
                </span>
                <span className="text-xs text-muted-foreground ml-1">{stat.description}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="font-headline">Recent Attendance Analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-body">Database Management Systems</span>
                <span className="font-headline font-medium">92%</span>
              </div>
              <Progress value={92} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-body">Operating Systems</span>
                <span className="font-headline font-medium">78%</span>
              </div>
              <Progress value={78} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-body">Machine Learning</span>
                <span className="font-headline font-medium">85%</span>
              </div>
              <Progress value={85} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="font-headline">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <Link href="/dashboard/attendance" className="flex flex-col items-center justify-center p-4 rounded-xl border border-dashed hover:border-primary hover:bg-primary/5 transition-all space-y-2 group">
              <div className="p-2 rounded-full bg-accent/10 text-accent group-hover:bg-accent group-hover:text-white transition-colors">
                <Users className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium">Add Students</span>
            </Link>
            <Link href="/dashboard/courses" className="flex flex-col items-center justify-center p-4 rounded-xl border border-dashed hover:border-primary hover:bg-primary/5 transition-all space-y-2 group">
              <div className="p-2 rounded-full bg-accent/10 text-accent group-hover:bg-accent group-hover:text-white transition-colors">
                <BookOpen className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium">New Course</span>
            </Link>
            <Link href="/dashboard/attendance" className="flex flex-col items-center justify-center p-4 rounded-xl border border-dashed hover:border-primary hover:bg-primary/5 transition-all space-y-2 group text-center">
              <div className="p-2 rounded-full bg-accent/10 text-accent group-hover:bg-accent group-hover:text-white transition-colors">
                <CheckSquare className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium">Mark Attendance</span>
            </Link>
            <Link href="/dashboard/planner" className="flex flex-col items-center justify-center p-4 rounded-xl border border-dashed hover:border-primary hover:bg-primary/5 transition-all space-y-2 group">
              <div className="p-2 rounded-full bg-accent/10 text-accent group-hover:bg-accent group-hover:text-white transition-colors">
                <Mail className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium">Lecture Planner</span>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ─── Student Dashboard Overview ──────────────────────────────────────────────
function StudentOverview({ displayName }: { displayName: string }) {
  // Upcoming class schedule for student (mirrors planner data)
  const upcomingClasses = [
    {
      time: "11:00 AM",
      course: "Operating Systems",
      code: "CS302",
      topic: "Process Scheduling Algorithms",
      room: "Room 402",
      status: "Ongoing",
      day: "Today",
    },
    {
      time: "03:00 PM",
      course: "Machine Learning",
      code: "AI401",
      topic: "Linear Regression Intro",
      room: "Lecture Hall 1",
      status: "Upcoming",
      day: "Today",
    },
    {
      time: "10:00 AM",
      course: "Operating Systems",
      code: "CS302",
      topic: "CPU Scheduling & Concurrency",
      room: "Room 402",
      status: "Upcoming",
      day: "Tomorrow",
    },
  ]

  const myAttendance = [
    { course: "Operating Systems (CS302)", percent: 78, below75: true },
    { course: "Database Management (CS301)", percent: 91, below75: false },
    { course: "Machine Learning (AI401)", percent: 85, below75: false },
  ]

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h2 className="text-3xl font-headline font-bold text-primary">
          Welcome, {displayName} 👋
        </h2>
        <p className="text-muted-foreground font-body">
          Here&apos;s your class schedule and attendance summary for today.
        </p>
      </div>

      {/* Next class highlight */}
      <Card className="border-none shadow-md bg-gradient-to-r from-primary/10 via-primary/5 to-background p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-accent" />
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                Next Upcoming Class
              </span>
            </div>
            <h3 className="text-xl font-headline font-bold text-primary">
              Operating Systems (CS302) — Process Scheduling Algorithms
            </h3>
            <p className="text-sm text-muted-foreground">
              Tuesday, Oct 24 • 11:00 AM • Room 402
            </p>
          </div>
          <Badge className="bg-accent text-white border-none px-3 py-1 font-headline">
            Starts in 45 mins
          </Badge>
        </div>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Today's + tomorrow's schedule */}
        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="font-headline">Your Schedule</CardTitle>
            <Button asChild variant="ghost" size="sm" className="text-xs text-accent gap-1">
              <Link href="/dashboard/planner">
                Full Planner <Calendar className="h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingClasses.map((cls, i) => (
              <div
                key={i}
                className="flex items-center gap-4 p-3 rounded-lg border border-border/60 bg-muted/20 hover:bg-primary/5 transition-colors"
              >
                <div className="flex flex-col items-center text-center w-16 shrink-0">
                  <span className="text-[10px] uppercase font-semibold text-muted-foreground">
                    {cls.day}
                  </span>
                  <span className="text-xs font-headline font-bold">{cls.time}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground uppercase font-medium">{cls.course}</p>
                  <p className="text-sm font-headline font-semibold text-primary truncate">{cls.topic}</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                    <MapPin className="h-3 w-3" /> {cls.room}
                  </div>
                </div>
                <Badge
                  variant={cls.status === "Ongoing" ? "default" : "outline"}
                  className={cls.status === "Ongoing" ? "bg-accent text-white border-none" : ""}
                >
                  {cls.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* My attendance */}
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="font-headline">My Attendance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {myAttendance.map((a) => (
              <div key={a.course} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-body">{a.course}</span>
                  <span className={`font-headline font-bold ${a.below75 ? "text-red-500" : "text-green-600"}`}>
                    {a.percent}%
                  </span>
                </div>
                <Progress
                  value={a.percent}
                  className={`h-2 ${a.below75 ? "[&>div]:bg-red-500" : "[&>div]:bg-green-500"}`}
                />
                {a.below75 && (
                  <p className="text-[10px] text-red-500 font-body">
                    ⚠ Below 75% — attendance is at risk
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Student quick links */}
      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="font-headline">Quick Links</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Link href="/dashboard/planner" className="flex flex-col items-center justify-center p-4 rounded-xl border border-dashed hover:border-primary hover:bg-primary/5 transition-all space-y-2 group">
            <div className="p-2 rounded-full bg-accent/10 text-accent group-hover:bg-accent group-hover:text-white transition-colors">
              <Calendar className="h-5 w-5" />
            </div>
            <span className="text-sm font-medium text-center">Lecture Planner</span>
          </Link>
          <Link href="/dashboard/courses" className="flex flex-col items-center justify-center p-4 rounded-xl border border-dashed hover:border-primary hover:bg-primary/5 transition-all space-y-2 group">
            <div className="p-2 rounded-full bg-accent/10 text-accent group-hover:bg-accent group-hover:text-white transition-colors">
              <BookOpen className="h-5 w-5" />
            </div>
            <span className="text-sm font-medium text-center">My Courses</span>
          </Link>
          <Link href="/dashboard/attendance" className="flex flex-col items-center justify-center p-4 rounded-xl border border-dashed hover:border-primary hover:bg-primary/5 transition-all space-y-2 group">
            <div className="p-2 rounded-full bg-accent/10 text-accent group-hover:bg-accent group-hover:text-white transition-colors">
              <CheckSquare className="h-5 w-5" />
            </div>
            <span className="text-sm font-medium text-center">Attendance Status</span>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Main Export ─────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { isTeacher, loading, user, profile } = useUserRole()
  const displayName =
    profile?.displayName || user?.displayName || user?.email?.split("@")[0] || "there"

  // Show a minimal skeleton while role is loading to avoid flicker
  if (loading) {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <div className="h-8 w-64 bg-muted rounded-lg animate-pulse" />
          <div className="h-4 w-96 bg-muted rounded animate-pulse" />
        </div>
        <div className="grid gap-6 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (isTeacher) {
    return <TeacherOverview displayName={displayName} />
  }

  return <StudentOverview displayName={displayName} />
}
