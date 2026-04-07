import { redirect } from "next/navigation";
import { axiosServer } from "@/utils/api/axiosServer";
import { DashboardLayoutClient } from "@/components/layout/DashboardLayoutClient";
import { RootState } from "@/redux/store";
import { ReduxHydrator } from "@/redux/provider";
import { Role } from "@/redux/features/userSlice";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
	try {
		const [res, tenants] = await Promise.all([
			axiosServer.get<{ user: any; role: string }>("/user/me"),
			axiosServer
				.get("/tenant")
				.then((res) => res.data)
				.catch(() => []),
		]);
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
			tenant: { tenants, myTenant: null, status: "idle", error: "" },
		};

		return (
			<>
				<ReduxHydrator initialState={initialState} />
				<DashboardLayoutClient currentUserRole={role as Role}>
					{children}
				</DashboardLayoutClient>
			</>
		);
	} catch (error) {
		// If unauthorized or any error occurs, redirect to login
		redirect("/login");
	}
}
