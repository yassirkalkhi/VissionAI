import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type Chat } from '@/types';
import { Link, usePage } from '@inertiajs/react';

export function NavMain({ chats = [] }: { chats: Chat[] }) {
    const page = usePage();
    return (
        <>
        <SidebarGroup className="px-2 py-0 pt-4">
            <SidebarGroupLabel>Today</SidebarGroupLabel>
            <SidebarMenu>
                {chats.map((item) => (
                    <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton asChild>
                            <Link href={`/chats/${item.id}`} className="flex flex-col items-start">
                                <span className="font-medium text-sm">{item.title}</span>
                                <span className="text-xs text-gray-500 truncate">{item.lastMessage}</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarGroup>
        <SidebarGroup className="px-2 py-0 pt-4">
            <SidebarGroupLabel>Yesterday</SidebarGroupLabel>
            <SidebarMenu>
                {chats.map((item) => (
                    <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton asChild>
                            <Link href={`/chats/${item.id}`} className="flex flex-col items-start">
                                <span className="font-medium text-sm">{item.title}</span>
                                <span className="text-xs text-gray-500 truncate">{item.lastMessage}</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarGroup>
        <SidebarGroup className="px-2 py-0 pt-4">
            <SidebarGroupLabel>Last 7 days</SidebarGroupLabel>
            <SidebarMenu>
                {chats.map((item) => (
                    <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton asChild>
                            <Link href={`/chats/${item.id}`} className="flex flex-col items-start">
                                <span className="font-medium text-sm">{item.title}</span>
                                <span className="text-xs text-gray-500 truncate">{item.lastMessage}</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarGroup>
        <SidebarGroup className="px-2 py-0 pt-4">
            <SidebarGroupLabel>Last 30 days</SidebarGroupLabel>
            <SidebarMenu>
                {chats.map((item) => (
                    <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton asChild>
                            <Link href={`/chats/${item.id}`} className="flex flex-col items-start">
                                <span className="font-medium text-sm">{item.title}</span>
                                <span className="text-xs text-gray-500 truncate">{item.lastMessage}</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarGroup>
      </>
    );
}
