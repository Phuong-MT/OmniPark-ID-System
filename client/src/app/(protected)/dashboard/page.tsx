import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ShieldAlert, Activity } from "lucide-react";
import { RoleBasedStats } from "./_components/RoleBasedStats";

export default function DashboardPage() {
	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col gap-2">
				<h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
				<p className="text-zinc-500 dark:text-zinc-400">
					Welcome back! Here is what's happening today in the OmniPark System.
				</p>
			</div>

			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				<RoleBasedStats />

				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium">Current Occupancy</CardTitle>
						<Activity className="h-4 w-4 text-zinc-500" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">84%</div>
						<p className="text-xs text-green-500 font-medium flex items-center gap-1 mt-1">
							+2% from last hour
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium">System Health</CardTitle>
						<CheckCircle2 className="h-4 w-4 text-green-500" />
					</CardHeader>
					<CardContent>
						<div className="text-xl font-bold text-green-500">Operational</div>
						<p className="text-xs text-zinc-500 mt-1">All systems nominal</p>
					</CardContent>
				</Card>
			</div>

			<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
				<Card className="lg:col-span-2">
					<CardHeader>
						<CardTitle>Recent Activity</CardTitle>
						<CardDescription>Live feed of events across the network.</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{[1, 2, 3, 4, 5].map((i) => (
								<div
									key={i}
									className="flex items-center gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-4 last:border-0 last:pb-0"
								>
									<div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
										<CheckCircle2 size={16} />
									</div>
									<div className="flex-1 space-y-1">
										<p className="text-sm font-medium leading-none">
											Vehicle Entry Logged
										</p>
										<p className="text-xs text-zinc-500 dark:text-zinc-400">
											Main Gate, Park Alpha
										</p>
									</div>
									<div className="text-xs text-zinc-500">2 min ago</div>
								</div>
							))}
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Quick Actions</CardTitle>
						<CardDescription>Commonly used operations.</CardDescription>
					</CardHeader>
					<CardContent className="space-y-2">
						<button className="w-full flex items-center justify-between rounded-md border border-zinc-200 dark:border-zinc-800 p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
							<span className="text-sm font-medium">Issue Temporary Pass</span>
							<Badge variant="secondary">New</Badge>
						</button>
						<button className="w-full flex items-center justify-between rounded-md border border-zinc-200 dark:border-zinc-800 p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
							<span className="text-sm font-medium">Restart Gateway</span>
							<ShieldAlert className="h-4 w-4 text-red-500" />
						</button>
						<button className="w-full flex items-center justify-between rounded-md border border-zinc-200 dark:border-zinc-800 p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
							<span className="text-sm font-medium">Generate Report</span>
						</button>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
