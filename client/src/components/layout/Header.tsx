"use client";

import * as React from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/redux/store";
import { setRole, Role } from "@/redux/features/authSlice";
import { Bell, Search, Menu } from "lucide-react";

interface HeaderProps {
	setIsMobileMenuOpen: (val: boolean) => void;
}

export function Header({ setIsMobileMenuOpen }: HeaderProps) {
	const dispatch = useDispatch();
	const { user, role } = useSelector((state: RootState) => state.auth);

	const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		dispatch(setRole(e.target.value as Role));
	};

	return (
		<header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-zinc-200 bg-white/80 px-4 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
			<div className="flex items-center gap-4">
				<button
					onClick={() => setIsMobileMenuOpen(true)}
					className="md:hidden flex h-9 w-9 items-center justify-center rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
				>
					<Menu size={20} />
				</button>
				<div className="relative hidden sm:flex items-center">
					<Search size={16} className="absolute left-3 text-zinc-400" />
					<input
						type="text"
						placeholder="Search... (Ctrl+K)"
						className="h-9 w-48 lg:w-64 rounded-md border border-zinc-200 bg-zinc-50 pl-9 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:border-blue-500"
					/>
				</div>
			</div>

			<div className="flex items-center gap-3 sm:gap-4">
				{/* DEV ONLY Role Switcher (Desktop) */}
				<div className="hidden md:flex items-center gap-2 bg-yellow-50 dark:bg-yellow-900/20 p-1 px-3 rounded-md border border-yellow-200 dark:border-yellow-900">
					<span className="text-xs font-medium text-yellow-800 dark:text-yellow-500 whitespace-nowrap">
						Dev Role Simulate:
					</span>
					<select
						value={role}
						onChange={handleRoleChange}
						className="text-xs bg-transparent border-none outline-none text-yellow-900 dark:text-yellow-400 font-semibold cursor-pointer"
					>
						<option value="POC">POC</option>
						<option value="ADMIN">ADMIN</option>
						<option value="SUPER_ADMIN">SUPER_ADMIN</option>
					</select>
				</div>

				<button className="relative flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50 shrink-0">
					<Bell size={20} />
					<span className="absolute top-2 right-2 flex h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-zinc-950" />
				</button>

				<div className="flex items-center gap-2 sm:gap-3 sm:border-l sm:border-zinc-200 sm:pl-4 dark:border-zinc-800">
					<div className="hidden flex-col items-end md:flex">
						<span className="text-sm font-medium leading-none whitespace-nowrap">
							{user?.name}
						</span>
						<span className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 whitespace-nowrap">
							{role === "SUPER_ADMIN"
								? "Super Admin"
								: role === "ADMIN"
									? "Admin"
									: "Point of Contact"}
						</span>
					</div>
					<div className="h-8 w-8 overflow-hidden rounded-full ring-2 ring-zinc-200 dark:ring-zinc-800 shrink-0">
						<img
							src={user?.avatar}
							alt={user?.name}
							className="h-full w-full object-cover"
						/>
					</div>
				</div>
			</div>
		</header>
	);
}
