"use client";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { setCurrentPark } from "@/redux/features/adminParksSlice";
export function ParkStoreHydrator({ park }: { park: any }) {
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(setCurrentPark(park));
        return () => {
            dispatch(setCurrentPark(null));
        };
    }, [park, dispatch]);
    return null;
}