"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Search, Upload, Send, Download } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { useFirestore, useAuth } from "@/firebase"
import { collection, serverTimestamp } from "firebase/firestore"
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates"
import { initiateAnonymousSignIn } from "@/firebase/non-blocking-login"
import { useUser } from "@/firebase/provider"

// Student data with requested emails
const initialStudents = [
  { id: "R2024-101", name: "Shriyash", email: "plot-manlike-fancy@duck.com", present: true },
  { id: "R2024-102", name: "Cyrus Thorne", email: "wages-idly-disk@duck.com", present: true },
  { id: "R2024-103", name: "Lyra Vance", email: "jazz-twig-paprika@duck.com", present: true },
  { id: "R2024-104", name: "Kaelen Brooks", email: "pants-destiny-lid@duck.com", present: true },
  { id: "R2024-105", name: "Elara Moon", email: "impale-bats-drool@duck.com", present: true },
  { id: "R2024-106", name: "Silas Vane", email: "slouchy-stem-crook@duck.com", present: true },
  { id: "R2024-107", name: "Atharv", email: "atharv.24bet10005@vitbhopal.ac.in", present: true },
]

export default function AttendancePage() {
  const [students, setStudents] = useState(initialStudents)
  const [isPosting, setIsPosting] = useState(false)
  const { toast } = useToast()
  const db = useFirestore()
  const auth = useAuth()
  const { user, isUserLoading } = useUser()

  // Auto-login anonymously if not authenticated
  useEffect(() => {
    if (!isUserLoading && !user && auth) {
      console.log("Auto-signing in anonymously...")
      initiateAnonymousSignIn(auth)
    }
  }, [user, isUserLoading, auth])

  const toggleAttendance = (id: string) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, present: !s.present } : s))
  }

  const handlePost = async () => {
    if (!db) {
      toast({
        variant: "destructive",
        title: "Firebase not initialized",
        description: "Please refresh the page and try again.",
      })
      return
    }

    if (!user) {
      toast({
        variant: "destructive",
        title: "Not authenticated",
        description: "Please wait while we sign you in...",
      })
      return
    }
    
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
      const notificationRef = collection(db, "absenteeNotifications")
      const emailResults = []
      
      for (const student of absentees) {
        let lectureSummary: string;
        let aiProvider = 'Fallback';
        
        try {
          // Call the multi-provider AI service via API
          const aiResponse = await fetch('/api/generate-summary', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              studentName: student.name,
              topic: 'Process Scheduling Algorithms',
              content: 'Process scheduling is a core function of the operating system. It decides which process in the ready queue is to be allocated the CPU. FCFS (First-Come, First-Served) is simple but can lead to the convoy effect. SJF (Shortest Job First) is optimal but difficult to implement. Round Robin (RR) uses time quantums to ensure fairness.',
            }),
          });

          if (aiResponse.ok) {
            const aiData = await aiResponse.json();
            lectureSummary = aiData.summary;
            aiProvider = aiData.provider;
            console.log(`✓ Summary generated using ${aiProvider}`);
          } else {
            throw new Error('AI API failed');
          }
        } catch (aiError) {
          console.error('All AI providers failed, using simple fallback:', aiError);
          lectureSummary = `Dear ${student.name},\n\nYou missed today's Operating Systems class on Process Scheduling Algorithms.\n\nKey Topics:\n- FCFS (First-Come, First-Served)\n- SJF (Shortest Job First)\n- Round Robin Scheduling\n\nPlease review your course materials.`;
          aiProvider = 'Simple Fallback';
        }

        // 2. Send email via API
        // Sending to your verified Resend email address
        const emailResponse = await fetch('/api/send-recovery-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: 'shriyashsahu2006@gmail.com', // Your verified email in Resend
            studentName: student.name,
            subjectName: "Operating Systems (CS302)",
            lectureTopic: "Process Scheduling Algorithms",
            lectureDate: new Date().toISOString().split('T')[0],
            summary: lectureSummary,
          }),
        })

        const emailResult = await emailResponse.json()
        
        if (!emailResult.success) {
          console.error(`Failed to send email to ${student.name}:`, emailResult.error)
        } else {
          console.log(`Email sent successfully to ${student.name}:`, emailResult.messageId)
        }
        
        emailResults.push({ 
          student: student.name, 
          success: emailResult.success,
          error: emailResult.error 
        })

        // 3. Persist to Firestore for tracking
        await addDocumentNonBlocking(notificationRef, {
          teacherId: user.uid,
          studentId: student.id,
          studentEmail: student.email,
          lectureTopic: "Process Scheduling Algorithms",
          emailSubject: "Missed Class Recovery — Operating Systems",
          emailSummary: lectureSummary,
          emailBody: lectureSummary,
          aiProvider: aiProvider, // Track which AI was used
          status: emailResult.success ? "Sent" : "Failed",
          emailMessageId: emailResult.messageId || null,
          notificationDateTime: serverTimestamp(),
          attendanceId: `att_${Date.now()}_${student.id}`,
          lecturePlanId: "lp_os_scheduling_001",
        })
      }
      
      const successCount = emailResults.filter(r => r.success).length
      const failCount = emailResults.filter(r => !r.success).length
      
      if (failCount > 0) {
        const failedStudents = emailResults.filter(r => !r.success)
        console.error('Failed emails:', failedStudents)
        
        toast({
          variant: failCount === absentees.length ? "destructive" : "default",
          title: failCount === absentees.length ? "All Emails Failed" : "Attendance Posted with Errors",
          description: `Emails sent: ${successCount} successful, ${failCount} failed. Check console for details.`,
        })
      } else {
        toast({
          title: "Attendance Posted Successfully",
          description: `Recovery emails sent to all ${successCount} absent students.`,
        })
      }
    } catch (error) {
      console.error("Error posting attendance:", error)
      toast({
        variant: "destructive",
        title: "Error processing recovery",
        description: error instanceof Error ? error.message : "Could not generate or send missed lecture packages.",
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
          <p className="text-muted-foreground font-body">Uncheck students to mark them absent and trigger AI Recovery.</p>
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
                  <TableHead className="text-right font-headline">Present?</TableHead>
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
