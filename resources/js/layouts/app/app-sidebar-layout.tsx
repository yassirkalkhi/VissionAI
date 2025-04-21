import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { type BreadcrumbItem } from '@/types';
import { type PropsWithChildren } from 'react';
import { type Conversation } from '@/types';
import { LanguageProvider } from '@/contexts/LanguageContext';

interface AppSidebarLayoutProps {
    breadcrumbs?: BreadcrumbItem[];
}

export default function AppSidebarLayout({ children, breadcrumbs = [] }: PropsWithChildren<AppSidebarLayoutProps>) {
    return (
        <LanguageProvider>
            <AppShell variant="sidebar">
                <AppSidebar  />
                <AppContent variant="sidebar">
                    <AppSidebarHeader breadcrumbs={breadcrumbs} />
                    {children}
                </AppContent>
            </AppShell>
        </LanguageProvider>
    );
}
