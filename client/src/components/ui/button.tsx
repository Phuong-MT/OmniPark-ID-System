import * as React from "react";
import { cn } from "@/utils/cn";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
	size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
	({ className, variant = "default", size = "default", ...props }, ref) => {
		return (
			<button
				className={cn(
					"inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:pointer-events-none disabled:opacity-50 dark:focus-visible:ring-zinc-300",
					{
						"bg-blue-600 text-white hover:bg-blue-700 shadow-sm": variant === "default",
						"bg-red-500 text-white hover:bg-red-600 shadow-sm":
							variant === "destructive",
						"border border-zinc-200 bg-transparent hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-zinc-50":
							variant === "outline",
						"bg-zinc-100 text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-800/80":
							variant === "secondary",
						"hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-50":
							variant === "ghost",
						"text-zinc-900 underline-offset-4 hover:underline dark:text-zinc-50":
							variant === "link",
						"h-9 px-4 py-2": size === "default",
						"h-8 rounded-md px-3 text-xs": size === "sm",
						"h-10 rounded-md px-8": size === "lg",
						"h-9 w-9": size === "icon",
					},
					className,
				)}
				ref={ref}
				{...props}
			/>
		);
	},
);
Button.displayName = "Button";

export { Button };
