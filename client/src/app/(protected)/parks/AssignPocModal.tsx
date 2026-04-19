"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { X, Loader2 } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { assignPoc } from "@/redux/features/assignmentsThunks";
import { clearAssignMessages } from "@/redux/features/assignmentsSlice";
import { fetchUsersList } from "@/redux/features/adminUsersThunks";
import { fetchParksList } from "@/redux/features/adminParksThunks";

function InfiniteSelect({
	items,
	value,
	onChange,
	onLoadMore,
	hasMore,
	loading,
	placeholder,
	disabled,
}: any) {
	const [open, setOpen] = React.useState(false);
	const loaderRef = React.useRef<HTMLDivElement>(null);

	React.useEffect(() => {
		let observer: IntersectionObserver;
		if (open) {
			observer = new IntersectionObserver(
				(entries) => {
					if (entries[0].isIntersecting && hasMore && !loading) {
						onLoadMore();
					}
				},
				{ root: null, rootMargin: "20px", threshold: 1.0 },
			);

			if (loaderRef.current) observer.observe(loaderRef.current);
		}
		return () => {
			if (observer && loaderRef.current) observer.unobserve(loaderRef.current);
		};
	}, [open, hasMore, loading, onLoadMore]);

	// close on click outside
	const containerRef = React.useRef<HTMLDivElement>(null);
	React.useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
				setOpen(false);
			}
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const selectedItem = items.find((i: any) => i.id === value);

	return (
		<div className="relative" ref={containerRef}>
			<button
				type="button"
				onClick={() => setOpen(!open)}
				disabled={disabled}
				className="flex h-9 w-full items-center justify-between rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 dark:border-zinc-800 dark:focus-visible:ring-zinc-300 disabled:opacity-50"
			>
				<span className="truncate">{selectedItem ? selectedItem.label : placeholder}</span>
			</button>
			{open && (
				<div className="absolute z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-md border border-zinc-200 bg-white shadow-md dark:border-zinc-800 dark:bg-zinc-950">
					{items.length === 0 && !loading && (
						<div className="px-3 py-2 text-sm text-zinc-500">No items found</div>
					)}
					{items.map((item: any) => (
						<div
							key={item.id}
							onClick={() => {
								onChange(item.id);
								setOpen(false);
							}}
							className={`cursor-pointer px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 ${value === item.id ? "bg-zinc-100 dark:bg-zinc-800 font-medium" : ""}`}
						>
							{item.label}
						</div>
					))}
					<div ref={loaderRef} className="flex h-8 items-center justify-center m-1">
						{loading && <Loader2 className="h-4 w-4 animate-spin text-zinc-500" />}
					</div>
				</div>
			)}
		</div>
	);
}

interface AssignPocModalProps {
	isOpen: boolean;
	onClose: () => void;
}

export function AssignPocModal({ isOpen, onClose }: AssignPocModalProps) {
	const dispatch = useDispatch<AppDispatch>();
	const { assigningPoc, assignError, assignSuccess } = useSelector(
		(state: RootState) => state.assignments,
	);

	const {
		users: allUsers,
		page: pocsPage,
		hasMore: pocsHasMore,
		loading: pocsLoading,
		error: pocsError,
	} = useSelector((state: RootState) => state.adminUsers);

	const {
		parks: parksList,
		page: parksPage,
		hasMore: parksHasMore,
		loading: parksLoading,
		error: parksError,
	} = useSelector((state: RootState) => state.adminParks);

	const pocsList = React.useMemo(
		() => allUsers.filter((u) => u.role === "POC"),
		[allUsers]
	);

	const loadingModalData = pocsLoading && parksLoading;
	const errorModalData = (pocsError || parksError) ?? undefined;

	const [selectedPocId, setSelectedPocId] = React.useState("");
	const [selectedParkId, setSelectedParkId] = React.useState("");
	const [startTime, setStartTime] = React.useState("");
	const [endTime, setEndTime] = React.useState("");

	// Initially fetch page 1 when modal opens
	React.useEffect(() => {
		if (isOpen) {
			dispatch(clearAssignMessages());
			dispatch(fetchUsersList({ page: 1, limit: 10, role: "POC" }));
			dispatch(fetchParksList({ page: 1, limit: 10 }));
		}
	}, [isOpen, dispatch]);

	const loadMorePocs = React.useCallback(() => {
		if (pocsHasMore && !pocsLoading) {
			dispatch(fetchUsersList({ page: pocsPage + 1, limit: 10, role: "POC" }));
		}
	}, [dispatch, pocsHasMore, pocsLoading, pocsPage]);

	const loadMoreParks = React.useCallback(() => {
		if (parksHasMore && !parksLoading) {
			dispatch(fetchParksList({ page: parksPage + 1, limit: 10 }));
		}
	}, [dispatch, parksHasMore, parksLoading, parksPage]);

	React.useEffect(() => {
		if (assignSuccess) {
			const timer = setTimeout(() => {
				onClose();
				setSelectedPocId("");
				setSelectedParkId("");
				setStartTime("");
				setEndTime("");
			}, 1500);
			return () => clearTimeout(timer);
		}
	}, [assignSuccess, onClose]);

	const handleAssignSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!selectedPocId || !selectedParkId) {
			return;
		}

		dispatch(
			assignPoc({
				pocId: selectedPocId,
				parkId: selectedParkId,
				schedule: {
					...(startTime ? { startTime: new Date(startTime).toISOString() } : {}),
					...(endTime ? { endTime: new Date(endTime).toISOString() } : {}),
				},
			}),
		);
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
			<div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg w-full max-w-md overflow-hidden flex flex-col">
				<div className="flex justify-between items-center p-4 border-b border-zinc-200 dark:border-zinc-800">
					<h2 className="text-lg font-semibold">Assign POC to Park</h2>
					<Button variant="ghost" size="icon" onClick={onClose}>
						<X className="h-4 w-4" />
					</Button>
				</div>
				<div className="p-4 flex-1 overflow-y-auto">
					{loadingModalData ? (
						<div className="flex justify-center items-center py-8">
							<Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
						</div>
					) : (
						<form
							id="assign-form"
							onSubmit={handleAssignSubmit}
							className="flex flex-col gap-4"
						>
							{(errorModalData || assignError) && (
								<div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-2 rounded">
									{errorModalData || assignError}
								</div>
							)}
							{assignSuccess && (
								<div className="text-sm text-green-500 bg-green-50 dark:bg-green-900/20 p-2 rounded">
									{assignSuccess}
								</div>
							)}

							<div className="flex flex-col gap-2">
								<label className="text-sm font-medium">Select POC</label>
								<InfiniteSelect
									items={pocsList.map((p) => ({
										id: p.id,
										label: `${p.name} (${p.email})`,
									}))}
									value={selectedPocId}
									onChange={setSelectedPocId}
									onLoadMore={loadMorePocs}
									hasMore={pocsHasMore}
									loading={pocsLoading}
									placeholder="Select a POC"
									disabled={loadingModalData && pocsList.length === 0}
								/>
							</div>

							<div className="flex flex-col gap-2">
								<label className="text-sm font-medium">Select Park</label>
								<InfiniteSelect
									items={parksList.map((p) => ({ id: p._id, label: p.name }))}
									value={selectedParkId}
									onChange={setSelectedParkId}
									onLoadMore={loadMoreParks}
									hasMore={parksHasMore}
									loading={parksLoading}
									placeholder="Select a Park"
									disabled={loadingModalData && parksList.length === 0}
								/>
							</div>

							<div className="flex flex-col gap-2">
								<label className="text-sm font-medium">Start Date & Time (Optional)</label>
								<input
									type="datetime-local"
									className="flex h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 dark:border-zinc-800 dark:focus-visible:ring-zinc-300"
									value={startTime}
									onChange={(e) => setStartTime(e.target.value)}
								/>
							</div>

							<div className="flex flex-col gap-2">
								<label className="text-sm font-medium">End Date & Time (Optional)</label>
								<input
									type="datetime-local"
									className="flex h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 dark:border-zinc-800 dark:focus-visible:ring-zinc-300"
									value={endTime}
									onChange={(e) => setEndTime(e.target.value)}
								/>
							</div>
						</form>
					)}
				</div>
				<div className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-2">
					<Button type="button" variant="outline" onClick={onClose}>
						Cancel
					</Button>
					<Button
						type="submit"
						form="assign-form"
						disabled={assigningPoc || loadingModalData}
					>
						{assigningPoc && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
						Assign
					</Button>
				</div>
			</div>
		</div>
	);
}
