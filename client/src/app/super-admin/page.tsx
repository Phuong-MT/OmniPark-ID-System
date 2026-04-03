"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ServerCrash, Database, Network, Power, Terminal } from "lucide-react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";

export default function SuperAdminPage() {
	const role = useSelector((state: RootState) => state.user.role);

	if (role !== "SUPER_ADMIN") {
		return (
			<div className="flex flex-col items-center justify-center p-12 text-center h-[50vh]">
				<div className="h-16 w-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4 dark:bg-red-900/30 dark:text-red-400">
					<ServerCrash className="h-8 w-8" />
				</div>
				<h2 className="text-2xl font-bold tracking-tight mb-2">Restricted Access</h2>
				<p className="text-zinc-500 max-w-sm">
					This area is strictly for Super Administrators. System configuration changes are
					prohibited for your role.
				</p>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col gap-2">
				<h1 className="text-3xl font-bold tracking-tight">System Configuration</h1>
				<p className="text-zinc-500 dark:text-zinc-400">
					Global metrics, multi-tenant overview, and feature toggles.
				</p>
			</div>

			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				<Card className="border-t-4 border-t-purple-500">
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium">Global Tenants</CardTitle>
						<Database className="h-4 w-4 text-zinc-500" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">12</div>
						<p className="text-xs text-zinc-500 mt-1">Active companies</p>
					</CardContent>
				</Card>

				<Card className="border-t-4 border-t-blue-500">
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium">Total API Hits</CardTitle>
						<Network className="h-4 w-4 text-zinc-500" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">2.4M</div>
						<p className="text-xs text-zinc-500 mt-1">Past 24 hours</p>
					</CardContent>
				</Card>

				<Card className="border-t-4 border-t-green-500">
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium">DB Connection Status</CardTitle>
						<Power className="h-4 w-4 text-zinc-500" />
					</CardHeader>
					<CardContent>
						<div className="flex items-center gap-2 text-2xl font-bold text-green-500">
							<span className="flex h-3 w-3 rounded-full bg-green-500 animate-pulse ml-1" />
							Stable
						</div>
						<p className="text-xs text-zinc-500 mt-1">12ms avg latency</p>
					</CardContent>
				</Card>

				<Card className="bg-zinc-950 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-950">
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium flex items-center gap-2">
							<Terminal className="h-4 w-4" />
							CLI Quick Action
						</CardTitle>
					</CardHeader>
					<CardContent className="h-full">
						<p className="text-xs opacity-70 mb-2 font-mono">
							sys&gt; systemctl restart core
						</p>
						<Badge
							variant="secondary"
							className="bg-zinc-800 text-zinc-100 dark:bg-zinc-200 dark:text-zinc-900 cursor-pointer"
						>
							Execute
						</Badge>
					</CardContent>
				</Card>
			</div>

			<div className="grid gap-6 md:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle>Feature Toggles</CardTitle>
						<CardDescription>
							Enable or disable beta features across all tenants.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						{[
							{
								id: "f_lpr_v2",
								name: "LPR Engine v2",
								status: true,
								desc: "Uses new ML model for license plate recognition",
							},
							{
								id: "f_payment_stripe",
								name: "Stripe Integration",
								status: true,
								desc: "Allow tenants to use Stripe directly",
							},
							{
								id: "f_mqtt_bridge",
								name: "Legacy MQTT Bridge",
								status: false,
								desc: "Support for v1.x hardware",
							},
						].map((feature) => (
							<div
								key={feature.id}
								className="flex items-center justify-between py-3 border-b border-zinc-100 dark:border-zinc-800 last:border-0 last:pb-0"
							>
								<div className="space-y-1">
									<div className="flex items-center gap-2">
										<p className="text-sm font-medium leading-none">
											{feature.name}
										</p>
										<Badge
											variant="outline"
											className="text-[10px] h-4 py-0 px-1"
										>
											{feature.id}
										</Badge>
									</div>
									<p className="text-xs text-zinc-500">{feature.desc}</p>
								</div>
								<div
									className={`w-10 h-6 rounded-full relative cursor-pointer border-2 border-transparent transition-colors ${feature.status ? "bg-purple-600" : "bg-zinc-200 dark:bg-zinc-800"}`}
								>
									<div
										className={`w-5 h-5 bg-white rounded-full absolute top-0 shadow-sm ${feature.status ? "right-0" : "left-0"}`}
									/>
								</div>
							</div>
						))}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Tenant Usage Quotas</CardTitle>
						<CardDescription>Monitor high-usage tenants.</CardDescription>
					</CardHeader>
					<CardContent className="space-y-6">
						<div className="space-y-2">
							<div className="flex items-center justify-between text-sm">
								<span className="font-medium">Acme Parking Corp</span>
								<span className="text-zinc-500">89% of API quota</span>
							</div>
							<div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
								<div className="h-full bg-yellow-500 w-[89%]" />
							</div>
						</div>

						<div className="space-y-2">
							<div className="flex items-center justify-between text-sm">
								<span className="font-medium">City Metro Transit</span>
								<span className="text-zinc-500">45% of API quota</span>
							</div>
							<div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
								<div className="h-full bg-blue-500 w-[45%]" />
							</div>
						</div>

						<div className="space-y-2">
							<div className="flex items-center justify-between text-sm">
								<span className="font-medium">Global Airports Inc.</span>
								<span className="text-zinc-500 text-red-500">98% of API quota</span>
							</div>
							<div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
								<div className="h-full bg-red-500 w-[98%]" />
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
