"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, FileText, ChevronRight, BookOpen, Trash2, Edit2, Play } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { automatedLectureContentAnalysis } from "@/ai/flows/automated-lecture-content-analysis"

export default function CoursesPage() {
  const { toast } = useToast()
  const [analyzing, setAnalyzing] = useState(false)

  const courses = [
    { 
      id: "os-302", 
      name: "Operating Systems", 
      code: "CS302", 
      modules: 5, 
      students: 120,
      materials: [
        { name: "Module 1 - Introduction.pdf", type: "PDF" },
        { name: "Module 2 - Processes.pptx", type: "PPTX" }
      ]
    },
    { 
      id: "dbms-301", 
      name: "Database Management Systems", 
      code: "CS301", 
      modules: 4, 
      students: 115,
      materials: [
        { name: "Unit 1 - Normalization.pdf", type: "PDF" }
      ]
    },
    { 
      id: "ml-401", 
      name: "Machine Learning", 
      code: "AI401", 
      modules: 6, 
      students: 95,
      materials: []
    },
  ]

  const handleRunAnalysis = async () => {
    setAnalyzing(true)
    try {
      // Simulation of AI analysis for a course
      await automatedLectureContentAnalysis({
        lecturePlanText: "Module 1: Intro to OS, Module 2: Processes",
        studyMaterials: [
          { fileName: "intro.pdf", dataUri: "data:application/pdf;base64,..." }
        ]
      })
      toast({
        title: "Content Analysis Complete",
        description: "Materials have been mapped to the lecture plan automatically.",
      })
    } catch (error) {
      toast({
        title: "Analysis Failed",
        variant: "destructive"
      })
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-headline font-bold text-primary">Courses</h2>
          <p className="text-muted-foreground font-body">Manage your subjects and study materials.</p>
        </div>
        <Button className="gap-2 font-headline bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4" />
          Add New Course
        </Button>
      </div>

      <div className="grid gap-6">
        {courses.map((course) => (
          <Card key={course.id} className="border-none shadow-sm overflow-hidden group">
            <div className="flex flex-col md:flex-row">
              <div className="p-6 flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-accent/10 text-accent">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <Badge variant="outline" className="font-body text-xs border-primary/20">{course.code}</Badge>
                </div>
                <CardTitle className="text-xl font-headline text-primary mb-1">{course.name}</CardTitle>
                <div className="flex gap-4 mt-4">
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground uppercase font-medium">Modules</span>
                    <span className="text-lg font-headline font-semibold">{course.modules}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground uppercase font-medium">Students</span>
                    <span className="text-lg font-headline font-semibold">{course.students}</span>
                  </div>
                </div>
              </div>
              <div className="p-6 bg-muted/30 md:w-80 flex flex-col justify-between border-l">
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Materials</h4>
                  {course.materials.length > 0 ? (
                    course.materials.map((m, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm p-2 rounded-md bg-background border shadow-sm">
                        <FileText className="h-4 w-4 text-accent" />
                        <span className="truncate font-body">{m.name}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground font-body italic">No materials uploaded yet.</p>
                  )}
                </div>
                <div className="flex gap-2 mt-4">
                  <Button size="sm" variant="outline" className="flex-1 gap-1 font-body text-xs h-8">
                    <Plus className="h-3 w-3" /> Upload
                  </Button>
                  <Button 
                    size="sm" 
                    className="flex-1 gap-1 font-body text-xs h-8 bg-accent hover:bg-accent/90"
                    onClick={handleRunAnalysis}
                    disabled={analyzing}
                  >
                    <Play className="h-3 w-3" /> AI Map
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
