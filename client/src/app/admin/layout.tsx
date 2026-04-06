import { AdminLayout } from "@/components/layout/AdminLayout";
import { axiosServer } from "@/utils/api/axiosServer";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "OmniPark Admin",
    description: "Advanced Multi-Role Security & Parking Management",
};

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const tenants = await axiosServer.get("/tenant").then((res) => res.data).catch(() => []);

    return (
        <AdminLayout initialState={{ tenant: { tenants, myTenant: null, status: "idle", error: "" } }}>
            {children}
        </AdminLayout>
    );
}
