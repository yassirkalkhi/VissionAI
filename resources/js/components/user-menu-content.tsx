import { DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { UserInfo } from '@/components/user-info';
import { useMobileNavigation } from '@/hooks/use-mobile-navigation';
import { type User } from '@/types';
import { Link } from '@inertiajs/react';
import { Home, LogOut, Settings, Sun, Moon, Monitor } from 'lucide-react';
import { LanguageSelector } from './LanguageSelector';
import { useAppearance } from '@/hooks/use-appearance';

interface UserMenuContentProps {
    user: User;
}

export function UserMenuContent({ user }: UserMenuContentProps) {
    const cleanup = useMobileNavigation();
    const { appearance, updateAppearance } = useAppearance();

    return (
        <>
            <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <UserInfo user={user} showEmail={true} />
                </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                    <LanguageSelector />
                </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
                <div className="px-2 py-1.5">
                    <div className="inline-flex items-center gap-1 rounded-md bg-neutral-100 p-0.5 dark:bg-neutral-800 w-full">
                        <button
                            onClick={() => updateAppearance('light')}
                            className={`flex items-center justify-center rounded px-2 py-1 transition-colors flex-1 ${
                                appearance === 'light'
                                    ? 'bg-white shadow-xs dark:bg-neutral-700 dark:text-neutral-100'
                                    : 'text-neutral-500 hover:bg-neutral-200/60 hover:text-black dark:text-neutral-400 dark:hover:bg-neutral-700/60'
                            }`}
                        >
                            <Sun className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => updateAppearance('dark')}
                            className={`flex items-center justify-center rounded px-2 py-1 transition-colors flex-1 ${
                                appearance === 'dark'
                                    ? 'bg-white shadow-xs dark:bg-neutral-700 dark:text-neutral-100'
                                    : 'text-neutral-500 hover:bg-neutral-200/60 hover:text-black dark:text-neutral-400 dark:hover:bg-neutral-700/60'
                            }`}
                        >
                            <Moon className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => updateAppearance('system')}
                            className={`flex items-center justify-center rounded px-2 py-1 transition-colors flex-1 ${
                                appearance === 'system'
                                    ? 'bg-white shadow-xs dark:bg-neutral-700 dark:text-neutral-100'
                                    : 'text-neutral-500 hover:bg-neutral-200/60 hover:text-black dark:text-neutral-400 dark:hover:bg-neutral-700/60'
                            }`}
                        >
                            <Monitor className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                    <Link className="block w-full" href={route('profile.edit')} as="button" prefetch onClick={cleanup}>
                        <Settings className="mr-2" />
                        Settings
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
                <Link className="block w-full" method="post" href={route('logout')} as="button" onClick={cleanup}>
                    <LogOut className="mr-2 text-red-500" />
                  <span className='text-red-500'>Log out</span>  
                </Link>
            </DropdownMenuItem>
        </>
    );
}
