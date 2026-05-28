import { Socket as TSocket, io } from "socket.io-client";

interface ISocketInstance {
    namespace: string;
    instance: TSocket;
}

export default class Socket {
    private static instances: ISocketInstance[] = [];

    constructor(namespace: string) {
        const existing = Socket.instances.find(
            (e) => e.namespace === namespace
        );
        if (existing) return existing.instance;

        const socketInstance = io(
            `${process.env.REACT_APP_SOCKET_DOMAIN}:${process.env.REACT_APP_PORT_SOCKET}/${namespace}`,
            {
                transports: ["websocket"],
                path: `/socket`,
                reconnection: true,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
                reconnectionAttempts: Infinity,
            }
        );

        socketInstance.on("connect_error", (err) => {
            console.error(`[${namespace}] connect_error`, err);
        });

        socketInstance.on("connect_failed", (err) => {
            console.error(`[${namespace}] connect_failed`, err);
        });

        socketInstance.on("exception", (err) => {
            console.error(`[${namespace}] Socket error:`, err);
        });

        socketInstance.on("disconnect", (reason) => {
            console.log(`[${namespace}] disconnected:`, reason);
            Socket.instances = Socket.instances.filter(
                (e) => e.namespace !== namespace
            );
        });

        Socket.instances.push({
            namespace,
            instance: socketInstance,
        });
    }

    static getInstant(namespace: string) {
        const existing = Socket.instances.find(
            (ele) => ele.namespace === namespace
        );
        if (!existing) {
            new Socket(namespace);
        }
        return Socket.instances.find((e) => e.namespace === namespace)
            ?.instance;
    }
}