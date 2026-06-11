"use client";

import React, { useEffect } from "react";
import Socket from "./socket";

export const useSocket = ({
    namespace,
    listen,
}: {
    namespace: string;
    listen: (socket: any) => (() => void) | void;
}) => {
    useEffect(() => {
        const socket = Socket.getInstant(namespace);
        if (!socket) return;

        const cleanup = listen(socket);

        return () => {
            if (cleanup) cleanup();
        };
    }, [namespace, listen]);
};