"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

// Mock POC data
const MOCK_POCS = [
	{ id: '1', name: 'John Doe', avatar: 'https://i.pravatar.cc/150?u=1' },
	{ id: '2', name: 'Jane Smith', avatar: 'https://i.pravatar.cc/150?u=2' },
	{ id: '3', name: 'Mike Johnson', avatar: 'https://i.pravatar.cc/150?u=3' },
	{ id: '4', name: 'Emily Davis', avatar: 'https://i.pravatar.cc/150?u=4' },
];

export function ScheduleBoard({now}:{now: string}) {
	const [currentDisplayMonth, setCurrentDisplayMonth] = React.useState<Date>(new Date(now));

	const year = currentDisplayMonth.getFullYear();
	const month = currentDisplayMonth.getMonth();
	const daysInMonth = new Date(year, month + 1, 0).getDate();
	const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 (Sun) to 6 (Sat)

	const handlePrevMonth = () => setCurrentDisplayMonth(new Date(year, month - 1, 1));
	const handleNextMonth = () => setCurrentDisplayMonth(new Date(year, month + 1, 1));
	const handleToday = () => setCurrentDisplayMonth(new Date());

	// Generate mock schedule assignments: map day of month to an array of POCs
	const mockSchedules = React.useMemo(() => {
		const schedules: Record<number, typeof MOCK_POCS> = {};
		for (let i = 1; i <= daysInMonth; i++) {
			// Randomly assign 0 to 3 POCs per day
			const numPocs = Math.floor(Math.random() * 4);
			if (numPocs > 0) {
				// shuffle and pick
				const shuffled = [...MOCK_POCS].sort(() => 0.5 - Math.random());
				schedules[i] = shuffled.slice(0, numPocs);
			}
		}
		return schedules;
	}, [daysInMonth, month, year]);

	return (
		<Card className="border-none shadow-sm bg-white dark:bg-zinc-950">
			<CardHeader className="pb-4 pt-6 px-6">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<div className="p-2 bg-blue-100 dark:bg-blue-500/20 rounded-lg">
							<Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
						</div>
						<div>
							<CardTitle className="text-xl">POC Schedule</CardTitle>
							<CardDescription>
								{currentDisplayMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
							</CardDescription>
						</div>
					</div>
					<div className="flex items-center gap-2">
						<Button variant="outline" size="sm" onClick={handleToday} className="h-9">
							Today
						</Button>
						<div className="flex items-center rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden">
							<Button variant="ghost" size="icon" className="h-9 w-9 rounded-none border-r border-zinc-200 dark:border-zinc-800" onClick={handlePrevMonth}>
								<ChevronLeft className="h-4 w-4" />
							</Button>
							<Button variant="ghost" size="icon" className="h-9 w-9 rounded-none" onClick={handleNextMonth}>
								<ChevronRight className="h-4 w-4" />
							</Button>
						</div>
					</div>
				</div>
			</CardHeader>
			<CardContent className="px-6 pb-6">
				<div className="grid grid-cols-7 gap-px bg-zinc-200 dark:bg-zinc-800 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800">
					{/* Weekday headers */}
					{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
						<div key={day} className="bg-zinc-50 dark:bg-zinc-900 py-2 text-center text-xs font-medium text-zinc-500 dark:text-zinc-400">
							{day}
						</div>
					))}
					
					{/* Empty cells before month start */}
					{Array.from({ length: firstDayOfWeek }).map((_, i) => (
						<div key={`empty-${i}`} className="bg-white dark:bg-zinc-950 min-h-[5rem] md:min-h-[6rem] p-2" />
					))}

					{/* Month days */}
					{Array.from({ length: daysInMonth }).map((_, i) => {
						const dayNum = i + 1;
						const isToday = new Date().getDate() === dayNum && new Date().getMonth() === currentDisplayMonth.getMonth() && new Date().getFullYear() === currentDisplayMonth.getFullYear();
						const pocs = mockSchedules[dayNum] || [];

						return (
							<div key={dayNum} className={`group relative bg-white dark:bg-zinc-950 min-h-[5rem] md:min-h-[6rem] p-2 flex flex-col gap-1 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900 border-t border-transparent`}>
								<span className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-blue-600 text-white' : 'text-zinc-700 dark:text-zinc-300'}`}>
									{dayNum}
								</span>
								<div className="flex flex-wrap gap-1 mt-auto">
									{pocs.map((poc, idx) => (
										<img 
											key={idx} 
											src={poc.avatar} 
											alt={poc.name} 
											className="w-6 h-6 rounded-full border border-white dark:border-zinc-800"
											style={{ zIndex: pocs.length - idx }}
										/>
									))}
								</div>

								{/* Tooltip */}
								{pocs.length > 0 && (
									<div className="absolute z-50 bottom-full left-1/1 -translate-x-1/1 translate-y-1/1 mb-2 w-max max-w-[200px] bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900 text-xs rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none">
										<div className="p-2 flex flex-col gap-1">
											<span className="font-semibold border-b border-zinc-700 dark:border-zinc-300 pb-1 mb-1">Scheduled POCs</span>
											{pocs.map((poc, idx) => (
												<span key={idx}>{poc.name}</span>
											))}
										</div>
										{/* Tooltip Arrow */}
										<div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-t-zinc-900 dark:border-t-zinc-100"></div>
									</div>
								)}
							</div>
						)
					})}
				</div>
			</CardContent>
		</Card>
	);
}
