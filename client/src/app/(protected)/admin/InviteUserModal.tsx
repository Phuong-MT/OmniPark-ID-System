"use client";

import React, { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import apiClient from "@/utils/api/axios";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { fetchUsersList } from "@/redux/features/adminUsersThunks";

interface InviteUserModalProps {
	isOpen: boolean;
	onClose: () => void;
	currentUserRole: string;
}

export function InviteUserModal({ isOpen, onClose, currentUserRole }: InviteUserModalProps) {
	const [formData, setFormData] = useState({
		username: "",
		email: "",
		phone: "",
		role: "USER",
		tenantId: "", // SUPER_ADMIN can pick; standard ADMIN ignores this
	});

	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);
	const dispatch = useDispatch<AppDispatch>();
	const tenants = useSelector((state: RootState) => state.tenant.tenants);
	const {filters } = useSelector(
		(state: RootState) => state.adminUsers,
	);

	if (!isOpen) return null;

	// Determine assignable roles based on current user's role
	const getAssignableRoles = () => {
		if (currentUserRole === "SUPER_ADMIN") {
			return ["ADMIN", "POC"];
		}
		return ["POC"];
	};

	const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		setFormData({ ...formData, [e.target.name]: e.target.value });
		setError(null);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);

		if (!formData.username || !formData.email || !formData.role) {
			setError("Please fill in all required fields.");
			return;
		}

		if (currentUserRole === "SUPER_ADMIN" && !formData.tenantId) {
			setError("Please select a tenant to assign the user to.");
			return;
		}

		setIsLoading(true);
		try {
			await apiClient.post("/user/invite", formData);
			setSuccess(true);
			setTimeout(() => {
				setSuccess(false);
				onClose();
			}, 2000);
			dispatch(fetchUsersList({ page: 1, limit: 10, ...filters }));
		} catch (err: any) {
			if (err.response?.data?.message) {
				const apiMsg = err.response.data.message;
				setError(Array.isArray(apiMsg) ? apiMsg.join(", ") : apiMsg);
			} else {
				setError("An error occurred while sending the invitation.");
			}
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
			<div className="w-full max-w-md bg-white dark:bg-zinc-950 rounded-lg shadow-xl overflow-hidden border border-zinc-200 dark:border-zinc-800">
				<div className="flex items-center justify-between p-4 border-b border-zinc-100 dark:border-zinc-800">
					<h2 className="text-lg font-semibold tracking-tight">Invite New User</h2>
					<button
						onClick={onClose}
						className="p-1 rounded-md text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
						disabled={isLoading}
					>
						<X className="w-5 h-5" />
					</button>
				</div>

				{success ? (
					<div className="p-6 flex flex-col items-center text-center space-y-3">
						<div className="w-12 h-12 rounded-full bg-green-100 text-green-500 flex items-center justify-center dark:bg-green-900/30 dark:text-green-400">
							<svg
								className="w-6 h-6"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M5 13l4 4L19 7"
								/>
							</svg>
						</div>
						<h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
							Invitation Sent!
						</h3>
						<p className="text-sm text-zinc-500 dark:text-zinc-400">
							An email with login instructions has been sent to {formData.email}
						</p>
					</div>
				) : (
					<form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm">
						<div className="space-y-1">
							<label className="font-medium text-zinc-900 dark:text-zinc-100">
								Username <span className="text-red-500">*</span>
							</label>
							<input
								name="username"
								type="text"
								value={formData.username}
								onChange={handleChange}
								placeholder="johndoe123"
								className="w-full px-3 py-2 bg-transparent border border-zinc-200 focus:border-zinc-900 dark:border-zinc-800 dark:focus:border-zinc-300 rounded-md outline-none transition-colors"
								disabled={isLoading}
							/>
						</div>

						<div className="space-y-1">
							<label className="font-medium text-zinc-900 dark:text-zinc-100">
								Email Address <span className="text-red-500">*</span>
							</label>
							<input
								name="email"
								type="email"
								value={formData.email}
								onChange={handleChange}
								placeholder="john@example.com"
								className="w-full px-3 py-2 bg-transparent border border-zinc-200 focus:border-zinc-900 dark:border-zinc-800 dark:focus:border-zinc-300 rounded-md outline-none transition-colors"
								disabled={isLoading}
							/>
						</div>

						<div className="space-y-1">
							<label className="font-medium text-zinc-900 dark:text-zinc-100">
								Phone
							</label>
							<input
								name="phone"
								type="text"
								value={formData.phone}
								onChange={handleChange}
								placeholder="+1 234 567 890"
								className="w-full px-3 py-2 bg-transparent border border-zinc-200 focus:border-zinc-900 dark:border-zinc-800 dark:focus:border-zinc-300 rounded-md outline-none transition-colors"
								disabled={isLoading}
							/>
						</div>

						<div className="space-y-1">
							<label className="font-medium text-zinc-900 dark:text-zinc-100">
								Role <span className="text-red-500">*</span>
							</label>
							<select
								name="role"
								value={formData.role}
								onChange={handleChange}
								className="w-full px-3 py-2 bg-transparent border border-zinc-200 focus:border-zinc-900 dark:border-zinc-800 dark:focus:border-zinc-300 rounded-md outline-none transition-colors"
								disabled={isLoading}
							>
								{getAssignableRoles().map((role) => (
									<option key={role} value={role} className="dark:bg-zinc-900">
										{role}
									</option>
								))}
							</select>
						</div>

						{currentUserRole === "SUPER_ADMIN" && (
							<div className="space-y-1">
								<label className="font-medium text-zinc-900 dark:text-zinc-100">
									Assign to Tenant <span className="text-red-500">*</span>
								</label>
								<select
									name="tenantId"
									value={formData.tenantId}
									onChange={handleChange}
									className="w-full px-3 py-2 bg-transparent border border-zinc-200 focus:border-zinc-900 dark:border-zinc-800 dark:focus:border-zinc-300 rounded-md outline-none transition-colors"
									disabled={isLoading}
								>
									<option value="" disabled className="dark:bg-zinc-900">
										Select a tenant
									</option>
									{tenants?.map((t) => (
										<option
											key={t._id}
											value={t._id}
											className="dark:bg-zinc-900"
										>
											{t.name}
										</option>
									))}
								</select>
							</div>
						)}

						{error && (
							<div className="p-3 rounded-md bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-medium">
								{error}
							</div>
						)}

						<div className="pt-2 flex justify-end gap-3">
							<Button
								type="button"
								variant="ghost"
								onClick={onClose}
								disabled={isLoading}
							>
								Cancel
							</Button>
							<Button type="submit" disabled={isLoading}>
								{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
								Send Invite
							</Button>
						</div>
					</form>
				)}
			</div>
		</div>
	);
}
