"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar as CalendarIcon, Plus, MapPin, Clock, BookOpen, Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useUserRole } from "@/hooks/use-user-role"

export default function PlannerPage() {
  const { isTeacher } = useUserRole()

  const [schedule, setSchedule] = useState([
    { 
      day: "Monday", 
      date: "Oct 23", 
      sessions: [
        { time: "09:00 AM", course: "Operating Systems", topic: "Process States & Lifecycle", room: "Room 402", status: "Completed" },
        { time: "01:00 PM", course: "Database Management", topic: "ER Modeling Concepts", room: "Lab B", status: "Completed" }
      ]
    },
    { 
      day: "Tuesday", 
      date: "Oct 24", 
      sessions: [
        { time: "11:00 AM", course: "Operating Systems", topic: "Process Scheduling Algorithms", room: "Room 402", status: "Ongoing" },
        { time: "03:00 PM", course: "Machine Learning", topic: "Linear Regression Intro", room: "Lecture Hall 1", status: "Upcoming" }
      ]
    },
    { 
      day: "Wednesday", 
      date: "Oct 25", 
      sessions: [
        { time: "10:00 AM", course: "Operating Systems", topic: "CPU Scheduling & Concurrency", room: "Room 402", status: "Upcoming" },
        { time: "02:00 PM", course: "Database Management", topic: "Relational Algebra & Normalization", room: "Lab B", status: "Upcoming" }
      ]
    }
  ])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-3xl font-headline font-bold text-primary">
              {isTeacher ? "Lecture Planner" : "Class Schedule & Planner"}
            </h2>
            <Badge variant={isTeacher ? "default" : "secondary"}>
              {isTeacher ? "Teacher Mode" : "Student View"}
            </Badge>
          </div>
          <p className="text-muted-foreground font-body">
            {isTeacher 
              ? "Coordinate dates, slots, prerequisites, and teaching topics."
              : "Review your upcoming lecture schedule, topics, and room allocations."}
          </p>
        </div>

        {isTeacher && (
          <Button className="gap-2 font-headline bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4" />
            Schedule Topic
          </Button>
        )}
      </div>

      {/* Next Class Highlight (Specially curated for students) */}
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

      {/* Full Schedule List */}
      <div className="grid gap-8">
        {schedule.map((dayPlan) => (
          <div key={dayPlan.date} className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <CalendarIcon className="h-5 w-5 text-accent" />
              <h3 className="text-xl font-headline font-bold">{dayPlan.day}, {dayPlan.date}</h3>
            </div>
            
            <div className="grid gap-4">
              {dayPlan.sessions.map((session, idx) => (
                <Card key={idx} className="border-none shadow-sm overflow-hidden border-l-4 border-l-primary">
                  <CardContent className="p-0">
                    <div className="flex flex-col sm:flex-row">
                      <div className="p-6 flex flex-col justify-center items-center bg-muted/20 sm:w-32 text-center border-r">
                        <Clock className="h-4 w-4 text-muted-foreground mb-1" />
                        <span className="text-sm font-headline font-bold">{session.time}</span>
                      </div>
                      <div className="p-6 flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-muted-foreground uppercase">{session.course}</span>
                            {session.status === 'Ongoing' && (
                              <Badge className="bg-accent animate-pulse border-none h-1.5 w-1.5 rounded-full p-0" />
                            )}
                          </div>
                          <h4 className="text-lg font-headline font-bold text-primary">{session.topic}</h4>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground font-body">
                            <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {session.room}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={session.status === 'Completed' ? 'secondary' : 'outline'} className="font-body">
                            {session.status}
                          </Badge>
                          {isTeacher && (
                            <Button size="sm" variant="ghost" className="text-accent hover:text-accent hover:bg-accent/10">Edit</Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
