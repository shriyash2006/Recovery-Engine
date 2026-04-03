import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, BookOpen, CheckSquare, Mail, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"

export default function DashboardPage() {
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
        <p className="text-muted-foreground font-body">Welcome back, Dr. Academic. Here's what's happening today.</p>
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
            <Link href="/dashboard/students" className="flex flex-col items-center justify-center p-4 rounded-xl border border-dashed hover:border-primary hover:bg-primary/5 transition-all space-y-2 group">
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
            <Link href="/dashboard/reports" className="flex flex-col items-center justify-center p-4 rounded-xl border border-dashed hover:border-primary hover:bg-primary/5 transition-all space-y-2 group">
              <div className="p-2 rounded-full bg-accent/10 text-accent group-hover:bg-accent group-hover:text-white transition-colors">
                <Mail className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium">Send Reports</span>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
