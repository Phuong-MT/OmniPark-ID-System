'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/redux/store';
import { setRole, Role } from '@/redux/features/authSlice';
import { cn } from '@/utils/cn';
import {
    LayoutDashboard,
    MapPin,
    Cpu,
    Settings,
    ShieldCheck,
    ServerCrash,
    ChevronLeft,
    ChevronRight,
    X,
} from 'lucide-react';

const roleBasedLinks = {
    POC: [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'My Parks', href: '/parks', icon: MapPin },
        { name: 'Devices', href: '/devices', icon: Cpu },
        { name: 'Settings', href: '/settings', icon: Settings },
    ],
    ADMIN: [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Park Management', href: '/parks', icon: MapPin },
        { name: 'Infrastructure', href: '/devices', icon: Cpu },
        { name: 'Admin Controls', href: '/admin', icon: ShieldCheck },
        { name: 'Settings', href: '/settings', icon: Settings },
    ],
    SUPER_ADMIN: [
        { name: 'Global Overview', href: '/dashboard', icon: LayoutDashboard },
        { name: 'All Parks', href: '/parks', icon: MapPin },
        { name: 'All Devices', href: '/devices', icon: Cpu },
        { name: 'System Config', href: '/super-admin', icon: ServerCrash },
        { name: 'Admin Controls', href: '/admin', icon: ShieldCheck },
        { name: 'Settings', href: '/settings', icon: Settings },
    ],
};

interface SidebarProps {
    isMobileMenuOpen: boolean;
    setIsMobileMenuOpen: (val: boolean) => void;
}

export function Sidebar({ isMobileMenuOpen, setIsMobileMenuOpen }: SidebarProps) {
    const [isCollapsed, setIsCollapsed] = React.useState(false);
    const pathname = usePathname();
    const dispatch = useDispatch();
    const role = useSelector((state: RootState) => state.auth.role);

    const links = roleBasedLinks[role] || roleBasedLinks.POC;

    // Auto-close mobile menu on route change
    React.useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [pathname, setIsMobileMenuOpen]);

    const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        dispatch(setRole(e.target.value as Role));
    };

    return (
        <>
            {/* Mobile Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 z-40 bg-zinc-950/50 backdrop-blur-sm md:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            <div
                className={cn(
                    "fixed inset-y-0 left-0 z-50 flex h-screen flex-col border-r border-zinc-200 bg-white dark:bg-zinc-950 dark:border-zinc-800 transition-all duration-300 md:relative",
                    isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
                    isCollapsed ? "md:w-20 w-64" : "w-64"
                )}
            >
                <div className="flex h-14 items-center justify-between px-4 border-b border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center gap-2">
                        {!isCollapsed || isMobileMenuOpen ? (
                            <>
                                <div className="h-6 w-6 rounded-md bg-blue-600 flex items-center justify-center shrink-0">
                                    <span className="text-white text-xs font-bold">O</span>
                                </div>
                                <span className="font-semibold text-lg tracking-tight">OmniPark</span>
                            </>
                        ) : (
                            <div className="h-6 w-6 mx-auto rounded-md bg-blue-600 flex items-center justify-center shrink-0">
                                <span className="text-white text-xs font-bold">O</span>
                            </div>
                        )}
                    </div>

                    {/* Mobile close button */}
                    <button
                        className="md:hidden p-1 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50"
                        onClick={() => setIsMobileMenuOpen(false)}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Desktop Collapse Toggle */}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="hidden md:flex absolute -right-3 top-20 z-10 h-6 w-6 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-500 hover:text-zinc-900 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:hover:text-zinc-50"
                >
                    {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                </button>

                <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-1 px-3">
                    {links.map((link) => {
                        const isActive = pathname.startsWith(link.href);
                        return (
                            <Link
                                key={link.name}
                                href={link.href}
                                className={cn(
                                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                                        : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-50",
                                    (isCollapsed && !isMobileMenuOpen) && "md:justify-center md:px-0"
                                )}
                                title={(isCollapsed && !isMobileMenuOpen) ? link.name : undefined}
                            >
                                <link.icon size={20} className={cn(isActive && "text-blue-600 dark:text-blue-400 shrink-0")} />
                                {(!isCollapsed || isMobileMenuOpen) && <span>{link.name}</span>}
                            </Link>
                        );
                    })}
                </div>

                {/* Mobile ONLY Role Switcher (matches the one in header) */}
                <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 md:hidden">
                    <div className="flex flex-col gap-2 bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded-md border border-yellow-200 dark:border-yellow-900">
                        <span className="text-xs font-medium text-yellow-800 dark:text-yellow-500">Dev Role:</span>
                        <select
                            value={role}
                            onChange={handleRoleChange}
                            className="text-xs bg-transparent border-none outline-none text-yellow-900 dark:text-yellow-400 font-semibold cursor-pointer w-full p-1"
                        >
                            <option value="POC">POC</option>
                            <option value="ADMIN">ADMIN</option>
                            <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                        </select>
                    </div>
                </div>
            </div>
        </>
    );
}
