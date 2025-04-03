import { BreadcrumbItem, type SharedData } from '@/types';
import AppLayout from '@/layouts/header-app-layout';

import { Head, Link, usePage } from '@inertiajs/react';
import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';

export default function Welcome() {
    const { auth } = usePage<SharedData>().props;
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'home',
            href: '/dashboard',
        },
    ];
   return (
           <AppLayout breadcrumbs={breadcrumbs}>
               <Head title="Home" />
               <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                   <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                       <div className="border-sidebar-border/70 dark:border-sidebar-border relative aspect-video overflow-hidden rounded-xl border">
                           <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                       </div>
                       <div className="border-sidebar-border/70 dark:border-sidebar-border relative aspect-video overflow-hidden rounded-xl border">
                           <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                       </div>
                       <div className="border-sidebar-border/70 dark:border-sidebar-border relative aspect-video overflow-hidden rounded-xl border">
                           <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                       </div>
                   </div>
                   <div className="border-sidebar-border/70 dark:border-sidebar-border relative min-h-[100vh] flex-1 overflow-hidden rounded-xl border md:min-h-min">
                       <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                   </div>
               </div>
           </AppLayout>
       );
   }
   