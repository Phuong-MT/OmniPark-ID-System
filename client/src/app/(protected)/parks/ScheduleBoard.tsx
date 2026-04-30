"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { fetchAssignmentsByMonth } from "@/redux/features/assignmentsThunks";

export function ScheduleBoard({ now }: { now: string }) {
	const [currentDisplayMonth, setCurrentDisplayMonth] = React.useState<Date>(new Date(now));
	const [selectedPocId, setSelectedPocId] = React.useState<string | null>(null);
	const [dayPocDetails, setDayPocDetails] = React.useState<{ day: number; id: string } | null>(null);
	const dispatch = useDispatch<AppDispatch>();
	const { assignments, loadingAssignments } = useSelector(
		(state: RootState) => state.assignments,
	);
	const { parks } = useSelector((state: RootState) => state.adminParks);

	const getParkName = React.useCallback(
		(id: string) => {
			const park = parks.find((p) => p._id === id);
			return park ? park.name : id;
		},
		[parks],
	);

	const year = currentDisplayMonth.getFullYear();
	const month = currentDisplayMonth.getMonth();
	const daysInMonth = new Date(year, month + 1, 0).getDate();
	const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 (Sun) to 6 (Sat)

	const handlePrevMonth = () => setCurrentDisplayMonth(new Date(year, month - 1, 1));
	const handleNextMonth = () => setCurrentDisplayMonth(new Date(year, month + 1, 1));
	const handleToday = () => setCurrentDisplayMonth(new Date());

	React.useEffect(() => {
		const promise = dispatch(fetchAssignmentsByMonth({ year, month: month + 1 } as any));

		return () => promise.abort();
	}, [year, month, dispatch]);

	const scheduledPocs = React.useMemo(() => {
		const pocMap = new Map();
		assignments.forEach((a) => {
			if (a.pocId && a.pocId._id) {
				if (!pocMap.has(a.pocId._id)) {
					pocMap.set(a.pocId._id, {
						id: a.pocId._id,
						name: a.pocId.profile?.fullName || a.pocId.username || "Unknown",
						avatar:
							a.pocId.profile?.avatar ||
							`https://ui-avatars.com/api/?name=${encodeURIComponent(a.pocId.username || "U")}`,
						parkIds: new Set(a.parkId ? [a.parkId] : []),
					});
				} else {
					if (a.parkId) {
						pocMap.get(a.pocId._id).parkIds.add(a.parkId);
					}
				}
			}
		});
		return Array.from(pocMap.values()).map(p => ({ ...p, parkIds: Array.from(p.parkIds) }));
	}, [assignments]);

	const schedules = React.useMemo(() => {
		const s: Record<number, any[]> = {};
		for (let i = 1; i <= daysInMonth; i++) {
			const dayDate = new Date(year, month, i);
			const pocsForDay: any[] = [];

			assignments.forEach((a) => {
				const start = a.schedule?.startTime ? new Date(a.schedule.startTime) : null;
				const end = a.schedule?.endTime ? new Date(a.schedule.endTime) : null;

				let covers = true;
				if (
					start &&
					new Date(start.getFullYear(), start.getMonth(), start.getDate()) > dayDate
				) {
					covers = false;
				}
				if (end && new Date(end.getFullYear(), end.getMonth(), end.getDate()) < dayDate) {
					covers = false;
				}

				if (covers) {
					const p = scheduledPocs.find((p) => p.id === a.pocId?._id);
					if (p) {
						let shiftType = "full";
						if (start && end) {
							const startH = start.getHours() + start.getMinutes() / 60;
							const endH = end.getHours() + end.getMinutes() / 60;
							
							if (endH <= 12.5) {
								shiftType = "morning";
							} else if (startH >= 12.5) {
								shiftType = "afternoon";
							} else {
								shiftType = "full";
							}
						}

						const existing = pocsForDay.find((existing) => existing.id === p.id);
						if (!existing) {
							pocsForDay.push({ ...p, shiftType, parkIds: a.parkId ? [a.parkId] : [] });
						} else {
							if (existing.shiftType !== shiftType) {
								existing.shiftType = "full";
							}
							if (a.parkId && !existing.parkIds.includes(a.parkId)) {
								existing.parkIds.push(a.parkId);
							}
						}
					}
				}
			});
			if (pocsForDay.length > 0) {
				s[i] = pocsForDay;
			}
		}
		return s;
	}, [assignments, scheduledPocs, daysInMonth, year, month]);

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
								{currentDisplayMonth.toLocaleDateString("en-US", {
									month: "long",
									year: "numeric",
								})}
							</CardDescription>
							<div className="flex flex-wrap items-center gap-3 mt-1">
								{scheduledPocs.map((poc) => (
									<button
										key={poc.id}
										onClick={() =>
											setSelectedPocId((prev) =>
												prev === poc.id ? null : poc.id,
											)
										}
										title={poc.name}
										className={`relative rounded-full transition-all duration-200 outline-none ${
											selectedPocId === poc.id
												? "ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-zinc-950 scale-110"
												: selectedPocId
													? "opacity-40 grayscale hover:opacity-80"
													: "hover:scale-110 hover:ring-2 hover:ring-zinc-300 dark:hover:ring-zinc-700 hover:ring-offset-1 dark:hover:ring-offset-zinc-950"
										}`}
									>
										<img
											src={poc.avatar}
											alt={poc.name}
											className="w-7 h-7 rounded-full"
										/>
									</button>
								))}
							</div>
							{selectedPocId && (
								<div className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900 p-2 rounded-md border border-zinc-200 dark:border-zinc-800">
									<span className="font-semibold text-zinc-900 dark:text-zinc-100">Parks: </span>
									{scheduledPocs.find(p => p.id === selectedPocId)?.parkIds.map(getParkName).join(", ") || "None"}
								</div>
							)}
						</div>
					</div>
					<div className="flex items-center gap-2">
						<Button variant="outline" size="sm" onClick={handleToday} className="h-9">
							Today
						</Button>
						<div className="flex items-center rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden">
							<Button
								variant="ghost"
								size="icon"
								className="h-9 w-9 rounded-none border-r border-zinc-200 dark:border-zinc-800"
								onClick={handlePrevMonth}
							>
								<ChevronLeft className="h-4 w-4" />
							</Button>
							<Button
								variant="ghost"
								size="icon"
								className="h-9 w-9 rounded-none"
								onClick={handleNextMonth}
							>
								<ChevronRight className="h-4 w-4" />
							</Button>
						</div>
					</div>
				</div>
			</CardHeader>
			<CardContent className="px-6 pb-6">
				<div className="grid grid-cols-7 gap-px bg-zinc-200 dark:bg-zinc-800 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800">
					{/* Weekday headers */}
					{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
						<div
							key={day}
							className="bg-zinc-50 dark:bg-zinc-900 py-2 text-center text-xs font-medium text-zinc-500 dark:text-zinc-400"
						>
							{day}
						</div>
					))}

					{/* Empty cells before month start */}
					{Array.from({ length: firstDayOfWeek }).map((_, i) => (
						<div
							key={`empty-${i}`}
							className="bg-white dark:bg-zinc-950 min-h-[5rem] md:min-h-[6rem] p-2"
						/>
					))}

					{/* Month days */}
					{Array.from({ length: daysInMonth }).map((_, i) => {
						const dayNum = i + 1;
						const isToday =
							new Date().getDate() === dayNum &&
							new Date().getMonth() === currentDisplayMonth.getMonth() &&
							new Date().getFullYear() === currentDisplayMonth.getFullYear();
						const pocs = schedules[dayNum] || [];
						const visiblePocs = selectedPocId
							? pocs.filter((p) => p.id === selectedPocId)
							: pocs;
						const isDimmed = selectedPocId && visiblePocs.length === 0;

						return (
							<div
								key={dayNum}
								className={`group relative bg-white dark:bg-zinc-950 min-h-[5rem] md:min-h-[6rem] p-2 flex flex-col gap-1 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900 border-t border-transparent ${isDimmed ? "opacity-40 bg-zinc-50/50 dark:bg-zinc-900/30" : ""}`}
							>
								<span
									className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${isToday ? "bg-blue-600 text-white" : "text-zinc-700 dark:text-zinc-300"}`}
								>
									{dayNum}
								</span>
								<div className="flex flex-wrap gap-1 mt-auto relative">
									{visiblePocs.map((poc, idx) => (
										<div key={poc.id} className="relative inline-block">
											<img
												src={poc.avatar}
												alt={poc.name}
												onClick={(e) => {
													e.stopPropagation();
													setDayPocDetails(dayPocDetails?.id === poc.id && dayPocDetails?.day === dayNum ? null : { day: dayNum, id: poc.id });
												}}
												className={`w-6 h-6 rounded-full border-[2px] transition-all cursor-pointer ${
													poc.shiftType === "morning"
														? "border-yellow-400"
														: poc.shiftType === "afternoon"
															? "border-green-500"
															: poc.shiftType === "full"
																? "border-blue-500"
																: "border-white dark:border-zinc-800"
												} ${selectedPocId === poc.id ? "ring-2 ring-blue-500 scale-110 relative z-10 shadow-[0_0_8px_rgba(59,130,246,0.5)]" : ""}`}
												style={
													selectedPocId === poc.id
														? {}
														: { zIndex: visiblePocs.length - idx }
												}
											/>
											{dayPocDetails?.id === poc.id && dayPocDetails?.day === dayNum && (
												<div className="absolute z-[100] bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[200px] bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs rounded-md shadow-lg border border-zinc-200 dark:border-zinc-700 p-2 cursor-auto">
													<div className="font-semibold border-b border-zinc-200 dark:border-zinc-700 pb-1 mb-1">{poc.name}</div>
													<div className="break-words whitespace-normal">Parks: {poc.parkIds.map(getParkName).join(", ")}</div>
												</div>
											)}
										</div>
									))}
								</div>

								{/* Tooltip */}
								{visiblePocs.length > 0 && (
									<div className="absolute z-50 bottom-full left-1/1 -translate-x-1/1 translate-y-1/1 mb-2 w-max max-w-[200px] bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900 text-xs rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none">
										<div className="p-2 flex flex-col gap-1">
											<span className="font-semibold border-b border-zinc-700 dark:border-zinc-300 pb-1 mb-1">
												Scheduled POCs
											</span>
											{visiblePocs.map((poc, idx) => (
												<span key={idx}>{poc.name}</span>
											))}
										</div>
										{/* Tooltip Arrow */}
										<div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-t-zinc-900 dark:border-t-zinc-100"></div>
									</div>
								)}
							</div>
						);
					})}
				</div>
			</CardContent>
		</Card>
	);
}
