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
import { BookOpen, GraduationCap } from "lucide-react"
import AppLogo from "./app-logo"
import { Button } from "./ui/button"

interface AppSidebarProps {
  conversations?: Conversation[]
}

const NavItems = [
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
        <SidebarMenu className="px-2">
          {NavItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                className="text-neutral-600 hover:text-neutral-800 dark:text-neutral-300 dark:hover:text-neutral-100"
              >
                <Link href={item.href} target="_blank" rel="noopener noreferrer">
                  {item.icon && <item.icon className="h-7 w-7" />}
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
        <NavMain conversations={conversations} />
      </SidebarContent> 

      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}

