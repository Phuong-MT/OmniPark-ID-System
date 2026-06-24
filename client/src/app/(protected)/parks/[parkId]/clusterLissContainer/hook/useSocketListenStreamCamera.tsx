import React from "react";
import { useSocket } from "@/socket/useSocket";

export function useSocketListenStreamCamera(
    tenantCode?: string,
    cameraId?: string,
    onStreamUrlReceived?: (url: string) => void
) {
    const listenToStreamCam = React.useCallback((socket: any)=>{
        if (tenantCode && cameraId) {
            // Gửi yêu cầu lấy stream
            socket.emit("request_camera_stream", { tenantCode, cameraId });
        }

        socket.on("camera_stream_url", (data: { cameraId: string; streamUrl: string }) => {
            if (data.cameraId === cameraId && onStreamUrlReceived) {
                onStreamUrlReceived(data.streamUrl);
            }
        });

        socket.on("camera_stream_error", (data: { message: string }) => {
            console.error("Camera stream error: ", data.message);
        });

        return () => {
            socket.off("camera_stream_url");
            socket.off("camera_stream_error");
        };
    }, [tenantCode, cameraId, onStreamUrlReceived]);
    
    useSocket({
        namespace: "",
        listen: listenToStreamCam
    });
}