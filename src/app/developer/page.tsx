"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Terminal, Database, Server, Zap, RefreshCcw } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function DeveloperPage() {
  const logs = [
    { time: "14:20:05", level: "INFO", message: "AI Flow 'automatedLectureContentAnalysis' triggered for Course CS302." },
    { time: "14:21:12", level: "SUCCESS", message: "Successfully mapped 12 headings to Module 2." },
    { time: "14:25:30", level: "INFO", message: "Attendance post started for Slot 2, Session CS302." },
    { time: "14:25:45", level: "EMAIL", message: "Recovery email dispatched to student R2023003 (charlie.b@...)." },
    { time: "14:25:46", level: "EMAIL", message: "Recovery email dispatched to student R2023005 (ethan.h@...)." },
  ]

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#c9d1d9] p-8 font-code">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex items-center justify-between border-b border-[#30363d] pb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary rounded-md">
              <Terminal className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Recovery Engine // Dev Console</h1>
          </div>
          <div className="flex gap-4">
            <Button variant="outline" className="border-[#30363d] text-[#c9d1d9] hover:bg-[#161b22] gap-2">
              <RefreshCcw className="h-4 w-4" /> Reset DB
            </Button>
            <Button className="bg-[#238636] hover:bg-[#2ea043] text-white">System Status: Online</Button>
          </div>
        </header>

        <div className="grid md:grid-cols-3 gap-6">
          <Card className="bg-[#161b22] border-[#30363d] text-[#c9d1d9]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-[#8b949e]">Flow Latency</CardTitle>
              <Zap className="h-4 w-4 text-[#d29922]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1.2s <span className="text-sm font-normal text-[#8b949e]">avg</span></div>
            </CardContent>
          </Card>
          <Card className="bg-[#161b22] border-[#30363d] text-[#c9d1d9]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-[#8b949e]">Active Instances</CardTitle>
              <Server className="h-4 w-4 text-[#58a6ff]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">4</div>
            </CardContent>
          </Card>
          <Card className="bg-[#161b22] border-[#30363d] text-[#c9d1d9]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-[#8b949e]">DB Transactions</CardTitle>
              <Database className="h-4 w-4 text-[#79c0ff]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12,842</div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-[#8b949e]">System Logs</h2>
          <div className="bg-[#010409] rounded-lg border border-[#30363d] p-4 overflow-auto max-h-[400px]">
            {logs.map((log, i) => (
              <div key={i} className="flex gap-4 mb-2 hover:bg-[#161b22] p-1 rounded transition-colors group">
                <span className="text-[#8b949e] shrink-0">{log.time}</span>
                <span className={`shrink-0 font-bold ${
                  log.level === 'SUCCESS' ? 'text-[#3fb950]' : 
                  log.level === 'EMAIL' ? 'text-[#a5d6ff]' : 
                  'text-[#d29922]'
                }`}>[{log.level}]</span>
                <span className="text-[#c9d1d9]">{log.message}</span>
              </div>
            ))}
            <div className="animate-pulse flex gap-4 p-1">
              <span className="text-[#8b949e]">14:26:01</span>
              <span className="text-primary font-bold">_</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
