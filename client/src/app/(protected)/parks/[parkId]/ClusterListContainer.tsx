"use client";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";

export function ClusterListContainer() {
    const clusters = useSelector((state: RootState) => state.adminParks.currentPark?.clusters || []);
    return (
        <>
            {clusters.map((cluster: any, index: number) => (
                <ClusterDetailSection cluster={cluster} key={cluster._id || index} />
            ))}
        </>
    );
}

export function ClusterDetailSection({cluster}:{cluster:any}){
    return (
        <>Cluster section</>
    )
}