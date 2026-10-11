"use client"

import {
  BookOpen,
  LayoutDashboard,
  Users,
  CheckSquare,
  FileText,
  Settings,
  Mail,
  Calendar
} from "lucide-react"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useUserRole } from "@/hooks/use-user-role"

export function NavMain() {
  const pathname = usePathname()
  const { isTeacher } = useUserRole()

  const teacherItems = [
    { title: "Overview", url: "/dashboard", icon: LayoutDashboard },
    { title: "Courses", url: "/dashboard/courses", icon: BookOpen },
    { title: "Lecture Planner", url: "/dashboard/planner", icon: Calendar },
    { title: "Students", url: "/dashboard/students", icon: Users },
    { title: "Attendance", url: "/dashboard/attendance", icon: CheckSquare },
  ]

  const studentItems = [
    { title: "Overview", url: "/dashboard", icon: LayoutDashboard },
    { title: "Courses", url: "/dashboard/courses", icon: BookOpen },
    { title: "Lecture Planner & Schedule", url: "/dashboard/planner", icon: Calendar },
  ]

  const visibleItems = isTeacher ? teacherItems : studentItems

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="font-headline">
        {isTeacher ? "Teacher Portal" : "Student Portal"}
      </SidebarGroupLabel>
      <SidebarMenu>
        {visibleItems.map((item) => (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton
              asChild
              isActive={pathname === item.url}
              tooltip={item.title}
              className="font-body"
            >
              <Link href={item.url}>
                <item.icon />
                <span>{item.title}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}

