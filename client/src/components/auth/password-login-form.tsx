"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { loginAsync } from "@/redux/features/authThunks";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function PasswordLoginForm() {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [validationError, setValidationError] = useState("");

	const dispatch = useDispatch<AppDispatch>();
	const router = useRouter();
	const { status, error } = useSelector((state: RootState) => state.auth);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setValidationError("");

		if (!username) {
			setValidationError("Please enter a username");
			return;
		}
		if (password.length < 6) {
			setValidationError("Password must be at least 6 characters");
			return;
		}
		const resultAction = await dispatch(loginAsync({ username, password }));
		if (loginAsync.fulfilled.match(resultAction)) {
			router.push("/dashboard");
		}
	};

	return (
		<form className="space-y-6" onSubmit={handleSubmit}>
			<div className="space-y-4">
				<div className="space-y-2">
					<Label htmlFor="username" className="dark:text-gray-300">
						Username
					</Label>
					<Input
						id="username"
						type="text"
						placeholder="Enter your username"
						value={username}
						onChange={(e) => setUsername(e.target.value)}
						disabled={status === "loading"}
						required
						className="dark:bg-zinc-800 dark:border-zinc-700 dark:text-white dark:placeholder-gray-500"
					/>
				</div>

				<div className="space-y-2">
					<Label htmlFor="password" className="dark:text-gray-300">
						Password
					</Label>
					<Input
						id="password"
						type="password"
						placeholder="Enter your password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						disabled={status === "loading"}
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
				disabled={status === "loading"}
				className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
			>
				{status === "loading" ? "Signing in..." : "Sign in"}
			</button>
		</form>
	);
}
