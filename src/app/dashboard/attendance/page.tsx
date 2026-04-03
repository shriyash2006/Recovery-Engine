"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Search, Upload, Send, Download, CheckCircle2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { personalizedMissedLectureRecovery } from "@/ai/flows/personalized-missed-lecture-recovery"

// Updated student data with provided emails
const initialStudents = [
  { id: "R2023001", name: "Marcus Aurelius", email: "plot-manlike-fancy@duck.com", present: false },
  { id: "R2023002", name: "Seraphina Moon", email: "wages-idly-disk@duck.com", present: false },
  { id: "R2023003", name: "Leopold Fitz", email: "jazz-twig-paprika@duck.com", present: false },
  { id: "R2023004", name: "Jaxon Reed", email: "pants-destiny-lid@duck.com", present: false },
  { id: "R2023005", name: "Elowen Frost", email: "impale-bats-drool@duck.com", present: false },
  { id: "R2023006", name: "Silas Vane", email: "silas.v@university.edu", present: true },
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
      // Simulate calling the AI recovery flow for each absentee
      for (const student of absentees) {
        // In a real app, you'd fetch the lecturePlanDetails and extractedStudyMaterialText from your DB
        await personalizedMissedLectureRecovery({
          studentName: student.name,
          studentEmail: student.email,
          lectureTopic: "Process Scheduling Algorithms",
          lectureDate: new Date().toISOString().split('T')[0],
          lecturePlanDetails: "Covering FCFS, SJF, and Round Robin scheduling techniques with practical examples.",
          extractedStudyMaterialText: "Process scheduling is a core function of the operating system. It decides which process in the ready queue is to be allocated the CPU. FCFS (First-Come, First-Served) is the simplest algorithm where the process that requests the CPU first is allocated the CPU first. Shortest Job First (SJF) associates with each process the length of its next CPU burst. Round Robin (RR) scheduling is designed for time-sharing systems.",
          extractedHeadings: [
            { heading: "Intro to Scheduling", pageNumbers: [1, 2] },
            { heading: "FCFS Algorithm", pageNumbers: [3, 4] },
            { heading: "Shortest Job First", pageNumbers: [5, 6] },
            { heading: "Round Robin", pageNumbers: [7, 8, 9] }
          ]
        })
      }
      
      toast({
        title: "Attendance Posted Successfully",
        description: `Recovery packages generated and emails queued for ${absentees.length} students.`,
      })
    } catch (error) {
      toast({
        title: "Error posting attendance",
        variant: "destructive",
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
          <p className="text-muted-foreground font-body">Mark students and trigger AI recovery engines.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2 font-body border-primary text-primary hover:bg-primary/5">
            <Upload className="h-4 w-4" />
            Import Excel
          </Button>
          <Button variant="outline" className="gap-2 font-body border-primary text-primary hover:bg-primary/5">
            <Download className="h-4 w-4" />
            Export Absentees
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
                    <SelectValue placeholder="Select Date" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Today, Oct 24th - Slot 2</SelectItem>
                    <SelectItem value="yesterday">Yesterday, Oct 23rd - Slot 4</SelectItem>
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
                  <TableHead className="w-[100px] font-headline">Status</TableHead>
                  <TableHead className="font-headline">Reg. Number</TableHead>
                  <TableHead className="font-headline">Student Name</TableHead>
                  <TableHead className="font-headline">Email</TableHead>
                  <TableHead className="text-right font-headline">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student.id} className="font-body hover:bg-primary/5 transition-colors">
                    <TableCell>
                      {student.present ? (
                        <Badge variant="secondary" className="bg-green-100 text-green-700 border-none">Present</Badge>
                      ) : (
                        <Badge variant="destructive" className="bg-red-100 text-red-700 border-none">Absent</Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{student.id}</TableCell>
                    <TableCell>{student.name}</TableCell>
                    <TableCell className="text-muted-foreground">{student.email}</TableCell>
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
            <div className="flex gap-4">
              <div className="text-center">
                <p className="text-xs text-muted-foreground uppercase font-medium">Total</p>
                <p className="text-xl font-headline font-bold">{students.length}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground uppercase font-medium">Present</p>
                <p className="text-xl font-headline font-bold text-green-600">{students.filter(s => s.present).length}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground uppercase font-medium">Absent</p>
                <p className="text-xl font-headline font-bold text-red-500">{students.filter(s => !s.present).length}</p>
              </div>
            </div>
            <Button 
              size="lg" 
              className="gap-2 bg-primary hover:bg-primary/90 shadow-lg font-headline" 
              onClick={handlePost}
              disabled={isPosting}
            >
              {isPosting ? (
                <>Processing AI Recovery...</>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Post Attendance
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
