import { AdminLayout } from "@/components/layout/AdminLayout";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "OmniPark Admin",
    description: "Advanced Multi-Role Security & Parking Management",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <AdminLayout>
            {children}
        </AdminLayout>
    );
}
