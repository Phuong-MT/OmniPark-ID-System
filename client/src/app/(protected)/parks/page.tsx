import * as React from "react";
import { ParkManagement } from "./ParkManagement";
import { axiosServer } from "@/utils/api/axiosServer";

export const metadata = {
	title: "Park Management | OmniPark ID",
	description: "Manage parking facilities and locations.",
};

export default async function ParksPage() {
	// Fetch user role on server side to properly restrict view permissions
	let currentUserRole = "USER";
	try {
		const res = await axiosServer.get<{ user: any; role: string }>("/user/me");
		currentUserRole = res.data.role;
	} catch (error) {
		console.error("Failed to fetch user profile in ParksPage", error);
		// Assuming redirection is handled by layout or middleware
	}

	return <ParkManagement currentUserRole={currentUserRole} />;
}
