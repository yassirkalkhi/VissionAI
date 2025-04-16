import { NavFooter } from "@/components/nav-footer"
import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import type { Conversation } from "@/types"
import { Link, router } from "@inertiajs/react"
import { BookOpen, Folder, GraduationCap } from "lucide-react"
import AppLogo from "./app-logo"
import { Button } from "./ui/button"

interface AppSidebarProps {
  conversations?: Conversation[]
}

const footerNavItems = [
  {
    title: "Quizes",
    href: "/quizzes",
    icon: GraduationCap
  },
  {
    title: "Documentation",
    href: "/docs",
    icon: BookOpen,
  },
]

export function AppSidebar({ conversations = [] }: AppSidebarProps) {
  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/" prefetch>
                <AppLogo />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="pt-2">
        <Button variant={"secondary"} className="m-3 cursor-pointer" onClick={()=> router.visit('/chat')}>New Chat</Button>
        <NavMain conversations={conversations} />
      </SidebarContent> 

      <SidebarFooter>
        <NavFooter items={footerNavItems} className="mt-auto" />
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}

