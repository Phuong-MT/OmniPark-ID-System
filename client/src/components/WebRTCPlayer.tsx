"use client";

import React, { useEffect, useRef, useState } from "react";
import { Loader2, AlertCircle, Video } from "lucide-react";

interface WebRTCPlayerProps {
    streamUrl: string; // HTTP WHEP endpoint từ MediaMTX, ví dụ: http://<ip-edge>:8889/<tenantCode>_<cameraId>
}

export function WebRTCPlayer({ streamUrl }: WebRTCPlayerProps) {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!streamUrl) return;
        console.log(streamUrl);
        let isMounted = true;
        const pc = new RTCPeerConnection({
            iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        });
        peerConnectionRef.current = pc;

        pc.addTransceiver("video", { direction: "recvonly" });
        pc.addTransceiver("audio", { direction: "recvonly" });

        pc.ontrack = (event) => {
            if (videoRef.current && isMounted) {
                videoRef.current.srcObject = event.streams[0];
                setLoading(false);
            }
        };

        const startStreaming = async () => {
            try {
                setLoading(true);
                setError(null);

                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);

                // Gửi offer SDP tới MediaMTX WHEP endpoint
                const response = await fetch(streamUrl, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/sdp",
                    },
                    body: pc.localDescription?.sdp,
                });

                if (!response.ok) {
                    throw new Error(`MediaMTX WHEP HTTP error: ${response.status}`);
                }

                const answerSdp = await response.text();
                if (isMounted) {
                    await pc.setRemoteDescription(
                        new RTCSessionDescription({
                            type: "answer",
                            sdp: answerSdp,
                        })
                    );
                }
            } catch (err: any) {
                console.error("WebRTC connection failed:", err);
                if (isMounted) {
                    setError("Failed to establish WebRTC connection. Make sure MediaMTX is accessible.");
                    setLoading(false);
                }
            }
        };

        startStreaming();

        return () => {
            isMounted = false;
            if (peerConnectionRef.current) {
                peerConnectionRef.current.close();
                peerConnectionRef.current = null;
            }
            if (videoRef.current) {
                videoRef.current.srcObject = null;
            }
        };
    }, [streamUrl]);

    return (
        <div className="relative aspect-video w-full rounded-lg bg-zinc-900 border border-zinc-800 overflow-hidden flex flex-col items-center justify-center shadow-inner">
            {loading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-10 gap-2">
                    <Loader2 className="h-6 w-6 text-indigo-500 animate-spin" />
                    <span className="text-xs text-zinc-300">Establishing WebRTC Stream...</span>
                </div>
            )}
            
            {error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-10 p-4 text-center gap-2">
                    <AlertCircle className="h-8 w-8 text-rose-500" />
                    <span className="text-xs text-rose-400 font-medium">{error}</span>
                </div>
            )}

            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
            />

            <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] text-zinc-200 font-mono z-10">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping" />
                <span>LIVE WebRTC</span>
            </div>
            
            {/* Corner brackets */}
            <div className="absolute top-1.5 left-1.5 w-3 h-3 border-t border-l border-zinc-500/60 pointer-events-none" />
            <div className="absolute top-1.5 right-1.5 w-3 h-3 border-t border-r border-zinc-500/60 pointer-events-none" />
            <div className="absolute bottom-1.5 left-1.5 w-3 h-3 border-b border-l border-zinc-500/60 pointer-events-none" />
            <div className="absolute bottom-1.5 right-1.5 w-3 h-3 border-b border-r border-zinc-500/60 pointer-events-none" />
        </div>
    );
}
