"use client";

import * as React from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../redux/store";
import { getUserMeAsync } from "../../redux/features/userThunks";
import { usePathname, useRouter } from "next/navigation";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
	const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
	const dispatch = useDispatch<AppDispatch>();
	const { status, user } = useSelector((state: RootState) => state.user);
	const pathname = usePathname();
	const router = useRouter();

	React.useEffect(() => {
		if (status === "idle" && pathname !== "/login") {
			dispatch(getUserMeAsync() as any);
		}
	}, [dispatch, status, pathname]);

	React.useEffect(() => {
		if (status === "failed" && pathname !== "/login") {
			router.push("/login");
		}
	}, [status, pathname, router]);

	if (pathname === "/login") {
		return <>{children}</>;
	}

	if (status === "loading" || status === "idle") {
		return (
			<div className="flex h-screen w-full items-center justify-center bg-zinc-50 dark:bg-zinc-900 text-zinc-950 dark:text-zinc-50">
				<div className="flex flex-col items-center">
					<div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
					<p className="mt-4 text-sm font-medium text-zinc-500 dark:text-zinc-400">
						Loading profile...
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="flex h-screen w-full bg-zinc-50 dark:bg-zinc-900 text-zinc-950 dark:text-zinc-50">
			<Sidebar
				isMobileMenuOpen={isMobileMenuOpen}
				setIsMobileMenuOpen={setIsMobileMenuOpen}
			/>
			<div className="flex flex-1 flex-col overflow-hidden">
				<Header setIsMobileMenuOpen={setIsMobileMenuOpen} />
				<main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">{children}</main>
			</div>
		</div>
	);
}
