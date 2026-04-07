"use client";

import { useState } from "react";
import { PasswordLoginForm } from "./password-login-form";
import { CodeLoginForm } from "./code-login-form";
import { ForgotPasswordForm } from "./forgot-password-form";

export function LoginForm() {
	const [loginMethod, setLoginMethod] = useState<"password" | "code" | "forgot_password">(
		"password",
	);
	const [successMessage, setSuccessMessage] = useState("");

	return (
		<div className="w-full max-w-md space-y-8 bg-white dark:bg-zinc-900 p-8 rounded-xl shadow-lg border border-gray-100 dark:border-zinc-800">
			<div className="text-center">
				<h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
					{loginMethod === "forgot_password"
						? "Reset Password"
						: "Sign in to your account"}
				</h2>
				<p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
					{loginMethod === "forgot_password"
						? "Enter your email to receive a reset code."
						: "Welcome back! Please enter your details."}
				</p>
			</div>

			{successMessage && (
				<div className="bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-sm p-3 rounded-md text-center">
					{successMessage}
				</div>
			)}

			{loginMethod !== "forgot_password" && (
				<div className="flex border-b border-gray-200 dark:border-zinc-800 mb-6 relative">
					<button
						type="button"
						className={`flex-1 py-2 text-sm font-medium ${loginMethod === "password" ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"}`}
						onClick={() => {
							setLoginMethod("password");
							setSuccessMessage("");
						}}
					>
						Password Login
					</button>
					<button
						type="button"
						className={`flex-1 py-2 text-sm font-medium ${loginMethod === "code" ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"}`}
						onClick={() => {
							setLoginMethod("code");
							setSuccessMessage("");
						}}
					>
						Email Verification
					</button>
				</div>
			)}

			{loginMethod === "password" && <PasswordLoginForm />}
			{loginMethod === "code" && <CodeLoginForm />}
			{loginMethod === "forgot_password" && (
				<ForgotPasswordForm
					onBackToLogin={(msg) => {
						setLoginMethod("password");
						if (msg) setSuccessMessage(msg);
					}}
				/>
			)}

			{loginMethod !== "forgot_password" && (
				<div className="mt-4 text-center">
					<button
						className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
						onClick={() => {
							setLoginMethod("forgot_password");
							setSuccessMessage("");
						}}
					>
						Forgot your password?
					</button>
				</div>
			)}
		</div>
	);
}
