"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AppDispatch } from "@/redux/store";
import { createNewPark, fetchParksList } from "@/redux/features/adminParksThunks";
import { X, Loader2 } from "lucide-react";
import { useDispatch } from "react-redux";

interface NewParkModalProps {
	isOpen: boolean;
	onClose: () => void;
}

export function NewParkModal({ isOpen, onClose }: NewParkModalProps) {
	const dispatch = useDispatch<AppDispatch>();
	const [name, setName] = React.useState("");
	const [description, setDescription] = React.useState("");
	const [isLoading, setIsLoading] = React.useState(false);
	const [errorMsg, setErrorMsg] = React.useState("");
	const [successMsg, setSuccessMsg] = React.useState("");

	// Reset alerts when modal opens
	React.useEffect(() => {
		if (isOpen) {
			setErrorMsg("");
			setSuccessMsg("");
			setName("");
			setDescription("");
		}
	}, [isOpen]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim()) return;

		setIsLoading(true);
		setErrorMsg("");
		setSuccessMsg("");
		
		try {
			await dispatch(createNewPark({ name, description })).unwrap();
			setSuccessMsg("Park created successfully.");
			setName("");
			setDescription("");
			dispatch(fetchParksList({ page: 1, limit: 10 })); // reset/refresh
			
			// Close modal after a short delay so user can see success
			setTimeout(() => {
				onClose();
			}, 1000);
		} catch (error: any) {
			setErrorMsg(error || "Failed to create park.");
		} finally {
			setIsLoading(false);
		}
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
			<div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg w-full max-w-md overflow-hidden flex flex-col">
				<div className="flex justify-between items-center p-4 border-b border-zinc-200 dark:border-zinc-800">
					<div>
						<h2 className="text-lg font-semibold">Add New Park</h2>
						<p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
							Create a new parking facility here. Click save when you're done.
						</p>
					</div>
					<Button variant="ghost" size="icon" onClick={onClose}>
						<X className="h-4 w-4" />
					</Button>
				</div>
				<div className="p-4 flex-1 overflow-y-auto">
					<form onSubmit={handleSubmit} id="new-park-form" className="flex flex-col gap-4">
						{errorMsg && (
							<div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-2 rounded">
								{errorMsg}
							</div>
						)}
						{successMsg && (
							<div className="text-sm text-green-500 bg-green-50 dark:bg-green-900/20 p-2 rounded">
								{successMsg}
							</div>
						)}
					
						<div className="grid gap-2">
							<Label htmlFor="name">Park Name</Label>
							<Input
								id="name"
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder="e.g. Downtown Parking Center"
								required
								disabled={isLoading || !!successMsg}
							/>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="description">Description</Label>
							<textarea
								id="description"
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								className="flex min-h-[80px] w-full rounded-md border border-zinc-200 bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:placeholder:text-zinc-400 dark:focus-visible:ring-zinc-300"
								placeholder="Add a description (optional)"
								rows={3}
								disabled={isLoading || !!successMsg}
							/>
						</div>
					</form>
				</div>
				<div className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-2">
					<Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
						Cancel
					</Button>
					<Button type="submit" form="new-park-form" disabled={isLoading || !name.trim() || !!successMsg}>
						{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
						Save Park
					</Button>
				</div>
			</div>
		</div>
	);
}
