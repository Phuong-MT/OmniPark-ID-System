'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Shield, Lock, Search, MoreHorizontal } from 'lucide-react';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';

const mockUsers = [
    { id: 1, name: 'Alice Smith', email: 'alice@omnipark.com', role: 'POC', status: 'Active', lastLogin: '2h ago' },
    { id: 2, name: 'Bob Jones', email: 'bob@omnipark.com', role: 'Admin', status: 'Active', lastLogin: '1d ago' },
    { id: 3, name: 'Charlie Ray', email: 'charlie@omnipark.com', role: 'POC', status: 'Inactive', lastLogin: '3w ago' },
];

export default function AdminPage() {
    const role = useSelector((state: RootState) => state.auth.role);

    if (role === 'POC') {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center h-[50vh]">
                <div className="h-16 w-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4 dark:bg-red-900/30 dark:text-red-400">
                    <Lock className="h-8 w-8" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight mb-2">Access Denied</h2>
                <p className="text-zinc-500 max-w-sm">You do not have the required permissions to view this page. Contact an administrator.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Admin Controls</h1>
                    <p className="text-zinc-500 dark:text-zinc-400">
                        Manage users, roles, and tenant configuration.
                    </p>
                </div>
                <Button>
                    <Users className="mr-2 h-4 w-4" />
                    Invite User
                </Button>
            </div>

            <div className="grid gap-6">
                <Card>
                    <CardHeader className="py-4 border-b border-zinc-100 dark:border-zinc-800 flex flex-row items-center justify-between">
                        <div className="space-y-1">
                            <CardTitle>User Management</CardTitle>
                            <CardDescription>Control who has access to the system.</CardDescription>
                        </div>
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                            <input
                                placeholder="Search users..."
                                className="flex h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 dark:border-zinc-800 dark:placeholder:text-zinc-400 dark:focus-visible:ring-zinc-300 pl-9"
                            />
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <table className="w-full text-sm">
                            <thead className="[&_tr]:border-b border-zinc-200 dark:border-zinc-800">
                                <tr className="border-b transition-colors">
                                    <th className="h-12 px-4 text-left align-middle font-medium text-zinc-500">Name</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-zinc-500">Role</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-zinc-500">Status</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-zinc-500">Last Login</th>
                                    <th className="h-12 px-4 text-center align-middle font-medium text-zinc-500 w-[50px]"></th>
                                </tr>
                            </thead>
                            <tbody className="[&_tr:last-child]:border-0">
                                {mockUsers.map((user) => (
                                    <tr key={user.id} className="border-b border-zinc-100 dark:border-zinc-800">
                                        <td className="p-4 align-middle">
                                            <div className="font-medium">{user.name}</div>
                                            <div className="text-xs text-zinc-500">{user.email}</div>
                                        </td>
                                        <td className="p-4 align-middle">
                                            <Badge variant={user.role === 'Admin' ? 'default' : 'secondary'}>{user.role}</Badge>
                                        </td>
                                        <td className="p-4 align-middle">
                                            <div className="flex items-center gap-2 text-zinc-500">
                                                <span className={`h-2 w-2 rounded-full ${user.status === 'Active' ? 'bg-green-500' : 'bg-red-500'}`} />
                                                {user.status}
                                            </div>
                                        </td>
                                        <td className="p-4 align-middle text-zinc-500">{user.lastLogin}</td>
                                        <td className="p-4 align-middle text-center">
                                            <Button variant="ghost" size="icon">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>

                <div className="grid md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Shield className="h-5 w-5 text-blue-500" />
                                <CardTitle>Role Permissions</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-zinc-500 mb-4">Review and modify the capabilities assigned to each role.</p>
                            <Button variant="outline" className="w-full">Edit Policy Definitions</Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Lock className="h-5 w-5 text-zinc-500" />
                                <CardTitle>Access Logs</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-zinc-500 mb-4">View detailed audit logs of system access and permission changes.</p>
                            <Button variant="outline" className="w-full">View Audit Trail</Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
