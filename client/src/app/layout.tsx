import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ReduxProvider } from "@/redux/provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
	title: "OmniPark Dashboard",
	description: "Advanced Multi-Role Security & Parking Management",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" className="dark">
			<body
				className={`${inter.className} min-h-screen bg-zinc-50 dark:bg-zinc-900 text-zinc-950 dark:text-zinc-50`}
			>
				<ReduxProvider>
					{children}
				</ReduxProvider>
			</body>
		</html>
	);
}
