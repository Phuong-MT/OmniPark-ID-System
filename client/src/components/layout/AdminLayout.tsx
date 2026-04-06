"use client";

import * as React from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../redux/store";
import { getAllTenantsAsync } from "@/redux/features/tenantThunks";

export function AdminLayout({ children }: { children: React.ReactNode }) {
    const dispatch = useDispatch<AppDispatch>();
    const { role: currentUserRole } = useSelector((state: RootState) => state.user);

    // Fetch tenants for super_admin filter dropdown
    React.useEffect(() => {
        if (currentUserRole === "SUPER_ADMIN") {
            dispatch(getAllTenantsAsync());
        }
    }, [currentUserRole, dispatch]);

    return (
        <>
            {children}
        </>
    );
}
