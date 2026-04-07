import { AdminLayout } from "@/components/layout/AdminLayout";
import { axiosServer } from "@/utils/api/axiosServer";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: {
		default: "OmniPark Admin Control",
		template: "%s | OmniPark Admin",
	},

	description:
		"Admin control panel for managing tenants, inviting users, and handling user roles in the OmniPark system.",

	keywords: [
		"OmniPark",
		"admin control panel",
		"tenant management",
		"user management",
		"invite users",
		"role management",
		"multi-tenant system",
	],

	authors: [{ name: "OmniPark Team" }],
	creator: "OmniPark",
	applicationName: "OmniPark Admin",

	metadataBase: new URL("https://your-domain.com"),

	openGraph: {
		title: "OmniPark Admin Control",
		description: "Manage tenants, invite users, and control roles in OmniPark.",
		url: "https://your-domain.com/admin",
		siteName: "OmniPark",
		locale: "en_US",
		type: "website",
	},

	twitter: {
		card: "summary_large_image",
		title: "OmniPark Admin Control",
		description: "Tenant & user management dashboard for OmniPark administrators.",
	},

	robots: {
		index: false,
		follow: false,
	},
};

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const tenants = await axiosServer
		.get("/tenant")
		.then((res) => res.data)
		.catch(() => []);

	return (
		<AdminLayout
			initialState={{ tenant: { tenants, myTenant: null, status: "idle", error: "" } }}
		>
			{children}
		</AdminLayout>
	);
}
