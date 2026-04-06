import { redirect } from "next/navigation";
import { axiosServer } from "@/utils/api/axiosServer";
import { DashboardLayoutClient } from "@/components/layout/DashboardLayoutClient";
import { RootState } from "@/redux/store";

export default async function ProtectedLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	try {
		const res = await axiosServer.get<{ user: any; role: string }>("/user/me");
		const { user, role } = res.data;

		// Build the initial state for the Redux store
		const initialState: Partial<RootState> = {
			user: {
				user: {
					id: user.id || user._id,
					name: user.name || user.email?.split("@")[0] || "User",
					email: user.email || "",
					avatar: `https://i.pravatar.cc/150?u=${user.email || "default"}`,
				},
				role: role as any,
				status: "succeeded",
				error: null,
			},
		};

		return (
			<DashboardLayoutClient initialState={initialState}>
				{children}
			</DashboardLayoutClient>
		);
	} catch (error) {
		// If unauthorized or any error occurs, redirect to login
		redirect("/login");
	}
}
