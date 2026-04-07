"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { sendVerificationCodeAsync, loginWithCodeAsync } from "@/redux/features/authThunks";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CodeLoginForm() {
	const [email, setEmail] = useState("");
	const [code, setCode] = useState("");
	const [validationError, setValidationError] = useState("");

	const dispatch = useDispatch<AppDispatch>();
	const router = useRouter();
	const { status, codeStatus, error } = useSelector((state: RootState) => state.auth);

	const handleSendCode = async () => {
		setValidationError("");
		if (!email.includes("@")) {
			setValidationError("Please enter a valid email address");
			return;
		}
		await dispatch(sendVerificationCodeAsync({ email }));
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
		const resultAction = await dispatch(loginWithCodeAsync({ email, code }));
		if (loginWithCodeAsync.fulfilled.match(resultAction)) {
			router.push("/dashboard");
		}
	};

	return (
		<form className="space-y-6" onSubmit={handleSubmit}>
			<div className="space-y-4">
				<div className="space-y-2">
					<Label htmlFor="email" className="dark:text-gray-300">
						Email
					</Label>
					<div className="flex space-x-2">
						<Input
							id="email"
							type="email"
							placeholder="name@example.com"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							disabled={status === "loading" || codeStatus === "loading"}
							required
							className="flex-1 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white dark:placeholder-gray-500"
						/>
						<button
							type="button"
							onClick={handleSendCode}
							disabled={codeStatus === "loading" || status === "loading" || !email}
							className="px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
						>
							{codeStatus === "loading" ? "Sending..." : "Send Code"}
						</button>
					</div>
					{codeStatus === "succeeded" && (
						<p className="text-xs text-green-600 dark:text-green-400 mt-1">
							Verification code sent!
						</p>
					)}
				</div>

				<div className="space-y-2">
					<Label htmlFor="code" className="dark:text-gray-300">
						Verification Code
					</Label>
					<Input
						id="code"
						type="text"
						placeholder="6-digit code"
						value={code}
						onChange={(e) => setCode(e.target.value)}
						disabled={status === "loading"}
						required
						maxLength={6}
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
				disabled={status === "loading"}
				className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
			>
				{status === "loading" ? "Signing in..." : "Sign in"}
			</button>
		</form>
	);
}
