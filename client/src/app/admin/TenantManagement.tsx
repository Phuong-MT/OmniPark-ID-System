import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building, Plus, Search, X } from "lucide-react";
import apiClient from "@/utils/api/axios";
import { useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { useDispatch } from "react-redux";
import { getAllTenantsAsync } from "@/redux/features/tenantThunks";

export function TenantManagement() {
    const dispatch = useDispatch<AppDispatch>();

    const tenants = useSelector((state: RootState) => state.tenant.tenants);

    const [searchQuery, setSearchQuery] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        address: "",
        contactEmail: "",
        contactPhone: "",
        maxDevices: 100,
        maxUsers: 50,
    });
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg(null);
        try {
            await apiClient.post("/tenant", {
                ...formData,
                maxDevices: Number(formData.maxDevices),
                maxUsers: Number(formData.maxUsers),
            });
            setIsModalOpen(false);
            setFormData({
                name: "",
                description: "",
                address: "",
                contactEmail: "",
                contactPhone: "",
                maxDevices: 100,
                maxUsers: 50,
            });
        } catch (error: any) {
            console.error("Failed to create tenant:", error);
            setErrorMsg(error.response?.data?.message || "Failed to create tenant. Please check the information and try again.");
        } finally {
            dispatch(getAllTenantsAsync());
            setLoading(false);
        }
    };

    const filteredTenants = tenants.filter((tenant) =>
        tenant.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <>
            <Card>
                <CardHeader className="py-4 border-b border-zinc-100 dark:border-zinc-800 flex flex-row items-center justify-between">
                    <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2">
                            <Building className="h-5 w-5" />
                            Tenant Management
                        </CardTitle>
                        <CardDescription>Manage tenants and organizations.</CardDescription>
                    </div>
                    <div className="flex gap-2">
                        <div className="relative w-64 hidden sm:block">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                            <input
                                placeholder="Search tenants..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="flex h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 dark:border-zinc-800 dark:placeholder:text-zinc-400 dark:focus-visible:ring-zinc-300 pl-9"
                            />
                        </div>
                        <Button onClick={() => setIsModalOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            New Tenant
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <table className="w-full text-sm">
                        <thead className="[&_tr]:border-b border-zinc-200 dark:border-zinc-800">
                            <tr className="border-b transition-colors">
                                <th className="h-12 px-4 text-left align-middle font-medium text-zinc-500">Name</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-zinc-500">Contact</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-zinc-500">Status</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-zinc-500">Limits</th>
                            </tr>
                        </thead>
                        <tbody className="[&_tr:last-child]:border-0">
                            {filteredTenants.map((tenant) => (
                                <tr key={tenant._id} className="border-b border-zinc-100 dark:border-zinc-800">
                                    <td className="p-4 align-middle">
                                        <div className="font-medium">{tenant.name}</div>
                                        <div className="text-xs text-zinc-500">{tenant.description || "N/A"}</div>
                                    </td>
                                    <td className="p-4 align-middle">
                                        <div>{tenant.contactEmail || "No email"}</div>
                                        <div className="text-xs text-zinc-500">{tenant.contactPhone || "No phone"}</div>
                                    </td>
                                    <td className="p-4 align-middle">
                                        <Badge variant={tenant.status === "ACTIVE" ? "default" : "secondary"}>
                                            {tenant.status || "ACTIVE"}
                                        </Badge>
                                    </td>
                                    <td className="p-4 align-middle text-zinc-500">
                                        <div className="text-xs">Users: {tenant.maxUsers || 0}</div>
                                        <div className="text-xs">Devices: {tenant.maxDevices || 0}</div>
                                    </td>
                                </tr>
                            ))}
                            {filteredTenants.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="p-4 text-center text-zinc-500">
                                        No tenants found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </CardContent>
            </Card>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-zinc-950 w-full max-w-md rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-800 p-6 relative">
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="absolute right-4 top-4 text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-100"
                        >
                            <X className="h-5 w-5" />
                        </button>
                        <h2 className="text-xl font-semibold mb-4">Create New Tenant</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="text-sm font-medium mb-1 block">Tenant Name *</label>
                                <input
                                    required
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="flex h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 dark:border-zinc-800"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-1 block">Description</label>
                                <input
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    className="flex h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 dark:border-zinc-800"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-1 block">Address</label>
                                <input
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    className="flex h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 dark:border-zinc-800"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium mb-1 block">Contact Email</label>
                                    <input
                                        type="email"
                                        name="contactEmail"
                                        value={formData.contactEmail}
                                        onChange={handleChange}
                                        className="flex h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 dark:border-zinc-800"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-1 block">Contact Phone</label>
                                    <input
                                        name="contactPhone"
                                        value={formData.contactPhone}
                                        onChange={handleChange}
                                        className="flex h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 dark:border-zinc-800"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium mb-1 block">Max Users</label>
                                    <input
                                        type="number"
                                        name="maxUsers"
                                        value={formData.maxUsers}
                                        onChange={handleChange}
                                        className="flex h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 dark:border-zinc-800"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-1 block">Max Devices</label>
                                    <input
                                        type="number"
                                        name="maxDevices"
                                        value={formData.maxDevices}
                                        onChange={handleChange}
                                        className="flex h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 dark:border-zinc-800"
                                    />
                                </div>
                            </div>
                            <div className="pt-4 flex justify-end gap-2">
                                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={loading}>
                                    {loading ? "Creating..." : "Create Tenant"}
                                </Button>
                            </div>
                            {errorMsg && (
                                <div className="text-sm font-medium text-red-500 text-right mt-2 animate-in fade-in">
                                    {errorMsg}
                                </div>
                            )}
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
