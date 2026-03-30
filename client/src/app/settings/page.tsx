"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { User, Bell, Palette, Globe, Key } from "lucide-react";

export default function SettingsPage() {
	const { user, role } = useSelector((state: RootState) => state.auth);

	return (
		<div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
			<div className="flex flex-col gap-2">
				<h1 className="text-3xl font-bold tracking-tight">Settings</h1>
				<p className="text-zinc-500 dark:text-zinc-400">
					Manage your account settings and preferences.
				</p>
			</div>

			<div className="grid gap-6">
				<Card>
					<CardHeader>
						<div className="flex items-center gap-2">
							<User className="h-5 w-5 text-zinc-500" />
							<CardTitle>Profile Information</CardTitle>
						</div>
						<CardDescription>
							Update your account profile details and email address.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="flex items-center gap-4 py-4">
							<div className="h-20 w-20 overflow-hidden rounded-full ring-4 ring-zinc-50 dark:ring-zinc-900 shadow-sm border border-zinc-200 dark:border-zinc-800">
								<img
									src={user?.avatar}
									alt={user?.name}
									className="h-full w-full object-cover"
								/>
							</div>
							<Button variant="outline">Change Avatar</Button>
						</div>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="space-y-2">
								<label className="text-sm font-medium leading-none">
									Full Name
								</label>
								<input
									defaultValue={user?.name}
									className="flex h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 dark:border-zinc-800 dark:focus-visible:ring-zinc-300"
								/>
							</div>
							<div className="space-y-2">
								<label className="text-sm font-medium leading-none">Email</label>
								<input
									defaultValue={user?.email}
									disabled
									className="flex h-9 w-full rounded-md border border-zinc-200 bg-zinc-50 dark:bg-zinc-900 px-3 py-1 text-sm shadow-sm opacity-60 cursor-not-allowed dark:border-zinc-800"
								/>
							</div>
						</div>
						<div className="pt-4 flex justify-end">
							<Button>Save Changes</Button>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<div className="flex items-center gap-2">
							<Palette className="h-5 w-5 text-zinc-500" />
							<CardTitle>Appearance</CardTitle>
						</div>
						<CardDescription>
							Customize how the OmniPark interface looks.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<div className="space-y-1">
									<p className="text-sm font-medium leading-none">Theme</p>
									<p className="text-sm text-zinc-500">
										Select your preferred color scheme.
									</p>
								</div>
								<select className="h-9 w-32 rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-sm dark:border-zinc-800">
									<option value="system">System</option>
									<option value="light">Light</option>
									<option value="dark">Dark</option>
								</select>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<div className="flex items-center gap-2">
							<Bell className="h-5 w-5 text-zinc-500" />
							<CardTitle>Notifications</CardTitle>
						</div>
						<CardDescription>Configure how you receive system alerts.</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="flex items-center justify-between py-2">
							<div className="space-y-1">
								<p className="text-sm font-medium leading-none">Security Alerts</p>
								<p className="text-sm text-zinc-500">
									Receive emails for security events.
								</p>
							</div>
							<div className="w-10 h-6 bg-blue-600 rounded-full relative cursor-pointer border-2 border-transparent transition-colors">
								<div className="w-5 h-5 bg-white rounded-full absolute right-0 top-0 shadow-sm" />
							</div>
						</div>
						<div className="flex items-center justify-between py-2 border-t border-zinc-100 dark:border-zinc-800">
							<div className="space-y-1">
								<p className="text-sm font-medium leading-none">
									Device Offline Status
								</p>
								<p className="text-sm text-zinc-500">
									Alerts when infrastructure goes down.
								</p>
							</div>
							<div className="w-10 h-6 bg-blue-600 rounded-full relative cursor-pointer border-2 border-transparent transition-colors">
								<div className="w-5 h-5 bg-white rounded-full absolute right-0 top-0 shadow-sm" />
							</div>
						</div>
						<div className="flex items-center justify-between py-2 border-t border-zinc-100 dark:border-zinc-800">
							<div className="space-y-1">
								<p className="text-sm font-medium leading-none">Weekly Reports</p>
								<p className="text-sm text-zinc-500">
									Occupancy and usage summaries.
								</p>
							</div>
							<div className="w-10 h-6 bg-zinc-200 dark:bg-zinc-800 rounded-full relative cursor-pointer border-2 border-transparent transition-colors">
								<div className="w-5 h-5 bg-white rounded-full absolute left-0 top-0 shadow-sm" />
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
