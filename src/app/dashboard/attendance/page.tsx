"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Search, Upload, Send, Download } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { personalizedMissedLectureRecovery } from "@/ai/flows/personalized-missed-lecture-recovery"

// Updated student data with provided emails and names
const initialStudents = [
  { id: "R2024-101", name: "Aria Sterling", email: "plot-manlike-fancy@duck.com", present: false },
  { id: "R2024-102", name: "Cyrus Thorne", email: "wages-idly-disk@duck.com", present: false },
  { id: "R2024-103", name: "Lyra Vance", email: "jazz-twig-paprika@duck.com", present: false },
  { id: "R2024-104", name: "Kaelen Brooks", email: "pants-destiny-lid@duck.com", present: false },
  { id: "R2024-105", name: "Elara Moon", email: "impale-bats-drool@duck.com", present: false },
  { id: "R2024-106", name: "Silas Vane", email: "slouchy-stem-crook@duck.com", present: false },
]

export default function AttendancePage() {
  const [students, setStudents] = useState(initialStudents)
  const [isPosting, setIsPosting] = useState(false)
  const { toast } = useToast()

  const toggleAttendance = (id: string) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, present: !s.present } : s))
  }

  const handlePost = async () => {
    setIsPosting(true)
    const absentees = students.filter(s => !s.present)
    
    if (absentees.length === 0) {
      toast({
        title: "No absentees",
        description: "All students are marked present. No recovery emails needed.",
      })
      setIsPosting(false)
      return
    }
    
    try {
      // Calling the AI recovery flow for each absentee to generate summaries and emails
      for (const student of absentees) {
        await personalizedMissedLectureRecovery({
          studentName: student.name,
          studentEmail: student.email,
          lectureTopic: "Process Scheduling Algorithms",
          lectureDate: new Date().toISOString().split('T')[0],
          lecturePlanDetails: "Covering FCFS, SJF, and Round Robin scheduling techniques with practical examples and performance analysis.",
          extractedStudyMaterialText: "Process scheduling is a core function of the operating system. It decides which process in the ready queue is to be allocated the CPU. FCFS (First-Come, First-Served) is simple but can lead to the convoy effect. SJF (Shortest Job First) is optimal but difficult to implement as it requires knowing the future. Round Robin (RR) uses time quantums to ensure fairness in time-sharing systems.",
          extractedHeadings: [
            { heading: "Intro to Scheduling", pageNumbers: [1, 2] },
            { heading: "FCFS & Convoy Effect", pageNumbers: [3, 4] },
            { heading: "Shortest Job First (SJF)", pageNumbers: [5, 6] },
            { heading: "Round Robin (RR) Mechanics", pageNumbers: [7, 8, 9] }
          ]
        })
      }
      
      toast({
        title: "Attendance Posted & AI Recovery Triggered",
        description: `Recovery packages generated and simulated emails sent to ${absentees.length} students.`,
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error processing recovery",
        description: "Could not generate missed lecture packages.",
      })
    } finally {
      setIsPosting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-headline font-bold text-primary">Attendance</h2>
          <p className="text-muted-foreground font-body">Mark absentees to trigger the AI Recovery Engine.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2 font-body border-primary text-primary hover:bg-primary/5">
            <Upload className="h-4 w-4" />
            Import Excel
          </Button>
          <Button variant="outline" className="gap-2 font-body border-primary text-primary hover:bg-primary/5">
            <Download className="h-4 w-4" />
            Export Data
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap gap-4 items-end justify-between">
            <div className="flex flex-wrap gap-4 flex-1">
              <div className="space-y-1.5 min-w-[200px]">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Course</label>
                <Select defaultValue="os">
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select Course" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="os">Operating Systems (CS302)</SelectItem>
                    <SelectItem value="dbms">Database Management (CS301)</SelectItem>
                    <SelectItem value="ml">Machine Learning (AI401)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 min-w-[200px]">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Lecture Session</label>
                <Select defaultValue="today">
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select Session" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Today, Oct 24th - Slot 2</SelectItem>
                    <SelectItem value="prev">Yesterday, Oct 23rd - Slot 4</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search students..." className="pl-9 bg-background" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border bg-background overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[120px] font-headline">Status</TableHead>
                  <TableHead className="font-headline">Student ID</TableHead>
                  <TableHead className="font-headline">Name</TableHead>
                  <TableHead className="font-headline">Email</TableHead>
                  <TableHead className="text-right font-headline">Mark Attendance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student.id} className="font-body hover:bg-primary/5 transition-colors">
                    <TableCell>
                      {student.present ? (
                        <Badge variant="secondary" className="bg-green-100 text-green-700 border-none px-3">Present</Badge>
                      ) : (
                        <Badge variant="destructive" className="bg-red-100 text-red-700 border-none px-3">Absent</Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{student.id}</TableCell>
                    <TableCell>{student.name}</TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs">{student.email}</TableCell>
                    <TableCell className="text-right">
                      <Checkbox 
                        checked={student.present} 
                        onCheckedChange={() => toggleAttendance(student.id)}
                        className="h-5 w-5 border-primary data-[state=checked]:bg-primary"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          <div className="mt-6 flex items-center justify-between p-4 bg-primary/5 rounded-xl border border-primary/10">
            <div className="flex gap-6">
              <div className="text-center">
                <p className="text-xs text-muted-foreground uppercase font-medium">Class Size</p>
                <p className="text-xl font-headline font-bold">{students.length}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground uppercase font-medium">Attending</p>
                <p className="text-xl font-headline font-bold text-green-600">{students.filter(s => s.present).length}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground uppercase font-medium">Missing</p>
                <p className="text-xl font-headline font-bold text-red-500">{students.filter(s => !s.present).length}</p>
              </div>
            </div>
            <Button 
              size="lg" 
              className="gap-2 bg-primary hover:bg-primary/90 shadow-lg font-headline min-w-[200px]" 
              onClick={handlePost}
              disabled={isPosting}
            >
              {isPosting ? (
                <>Generating Recovery...</>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Post Attendance
                </>
              )}
            </Button>
          </div>
          <p className="mt-4 text-xs text-center text-muted-foreground font-body">
            * Clicking "Post Attendance" will automatically send AI-generated lecture summaries to all absent students.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
