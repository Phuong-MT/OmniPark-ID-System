import { createContext, useContext, useEffect, useMemo } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext(null);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
    const socketInstance = useMemo(
        () =>
            io("http://localhost:4001", {
                transports: ["websocket"],
                path: "/socket",
                reconnection: true,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
                reconnectionAttempts: Infinity,
            }),
        []
    );
    socketInstance.on("connect_error", (err) => {
        console.log("connect_error", err);
    });
    socketInstance.on("connect_failed", (err, details) => {
        console.log("connect_failed", err, details);
    });
    socketInstance.on("disconnect", (err, details) => {
        console.log("disconnect", err, details);
    });
    socketInstance.on("exception", (err) => {
        console.log("Socket error: ", err);
    });

    useEffect(() => {
        return () => {
            socketInstance.disconnect();
        };
    }, [socketInstance]);

    return (
        <SocketContext.Provider value={socketInstance as any}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => useContext(SocketContext);