"use client";

import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { sendForgotPasswordCodeAsync, resetPasswordAsync } from "@/redux/features/authThunks";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ForgotPasswordFormProps {
	onBackToLogin: (message?: string) => void;
}

export function ForgotPasswordForm({ onBackToLogin }: ForgotPasswordFormProps) {
	const [email, setEmail] = useState("");
	const [code, setCode] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [validationError, setValidationError] = useState("");

	const dispatch = useDispatch<AppDispatch>();
	const { forgotPasswordCodeStatus, resetPasswordStatus, error } = useSelector(
		(state: RootState) => state.auth,
	);

	const handleSendCode = async () => {
		setValidationError("");
		if (!email.includes("@")) {
			setValidationError("Please enter a valid email address");
			return;
		}
		await dispatch(sendForgotPasswordCodeAsync({ email }));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setValidationError("");

		if (!email.includes("@")) {
			setValidationError("Please enter a valid email address");
			return;
		}
		if (code.length !== 6) {
			setValidationError("Verification code must be 6 digits");
			return;
		}
		if (newPassword.length < 6) {
			setValidationError("New password must be at least 6 characters");
			return;
		}
		const resultAction = await dispatch(resetPasswordAsync({ email, code, newPassword }));
		if (resetPasswordAsync.fulfilled.match(resultAction)) {
			onBackToLogin("Password reset successful. Please log in.");
		}
	};

	return (
		<form className="space-y-6" onSubmit={handleSubmit}>
			<div className="space-y-4">
				<div className="space-y-2">
					<Label htmlFor="reset-email" className="dark:text-gray-300">
						Email for Reset
					</Label>
					<div className="flex space-x-2">
						<Input
							id="reset-email"
							type="email"
							placeholder="name@example.com"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							disabled={
								resetPasswordStatus === "loading" ||
								forgotPasswordCodeStatus === "loading"
							}
							required
							className="flex-1 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white dark:placeholder-gray-500"
						/>
						<button
							type="button"
							onClick={handleSendCode}
							disabled={
								forgotPasswordCodeStatus === "loading" ||
								resetPasswordStatus === "loading" ||
								!email
							}
							className="px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
						>
							{forgotPasswordCodeStatus === "loading" ? "Sending..." : "Send Code"}
						</button>
					</div>
					{forgotPasswordCodeStatus === "succeeded" && (
						<p className="text-xs text-green-600 dark:text-green-400 mt-1">
							Verification code sent!
						</p>
					)}
				</div>

				<div className="space-y-2">
					<Label htmlFor="reset-code" className="dark:text-gray-300">
						Verification Code
					</Label>
					<Input
						id="reset-code"
						type="text"
						placeholder="6-digit code"
						value={code}
						onChange={(e) => setCode(e.target.value)}
						disabled={resetPasswordStatus === "loading"}
						required
						maxLength={6}
						className="dark:bg-zinc-800 dark:border-zinc-700 dark:text-white dark:placeholder-gray-500"
					/>
				</div>

				<div className="space-y-2">
					<Label htmlFor="new-password" className="dark:text-gray-300">
						New Password
					</Label>
					<Input
						id="new-password"
						type="password"
						placeholder="Enter new password"
						value={newPassword}
						onChange={(e) => setNewPassword(e.target.value)}
						disabled={resetPasswordStatus === "loading"}
						required
						className="dark:bg-zinc-800 dark:border-zinc-700 dark:text-white dark:placeholder-gray-500"
					/>
				</div>
			</div>

			{(validationError || error) && (
				<div className="bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400 text-sm p-3 rounded-md">
					{validationError || error}
				</div>
			)}

			<button
				type="submit"
				disabled={resetPasswordStatus === "loading"}
				className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
			>
				{resetPasswordStatus === "loading" ? "Processing..." : "Reset Password"}
			</button>

			<div className="mt-4 text-center">
				<button
					type="button"
					className="text-sm text-gray-600 dark:text-gray-400 hover:underline"
					onClick={() => onBackToLogin()}
				>
					Back to Login
				</button>
			</div>
		</form>
	);
}
