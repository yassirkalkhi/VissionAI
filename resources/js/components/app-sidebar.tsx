import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { Chat, type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import { BookOpen, Folder, History, LayoutGrid, MessageCircle } from 'lucide-react';
import AppLogo from './app-logo';

const chats : Chat[] = [
    {
        id: '1',
        title: 'Understanding TypeScript',
        lastMessage: 'Can you explain generics in TypeScript?',
        timestamp: '2023-10-01T10:30:00Z',
    },
    {
        id: '2',
        title: 'React State Management',
        lastMessage: 'What is the difference between Redux and Context API?',
        timestamp: '2023-10-02T14:15:00Z',
    },
    {
        id: '3',
        title: 'JavaScript Closures',
        lastMessage: 'How do closures work in JavaScript?',
        timestamp: '2023-10-03T09:45:00Z',
    },
    {
        id: '4',
        title: 'CSS Grid vs Flexbox',
        lastMessage: 'When should I use Grid over Flexbox?',
        timestamp: '2023-10-04T16:20:00Z',
    },
    {
        id: '5',
        title: 'Node.js Performance',
        lastMessage: 'How can I optimize my Node.js application?',
        timestamp: '2023-10-05T11:00:00Z',
    },
];
const mainNavItems: NavItem[] = [
  
    
];

const footerNavItems: NavItem[] = [
    {
        title: 'Repository',
        href: 'https://github.com/laravel/react-starter-kit',
        icon: Folder,
    },
    {
        title: 'Documentation',
        href: 'https://laravel.com/docs/starter-kits',
        icon: BookOpen,
    },
];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain chats={chats} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
