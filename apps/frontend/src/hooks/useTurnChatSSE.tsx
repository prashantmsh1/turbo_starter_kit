import { useEffect, useRef, useCallback } from "react";
import type { ChatMessage } from "@/store/api/threadApi";

const useTurnChatStream = (
    turnId: string,
    onMessage: (msg: ChatMessage) => void,
    onDone?: () => void,
    onChunk?: (
        chunk: string,
        isFirst: boolean,
        finished: boolean,
        sources?: Array<{ title: string; url: string; description: string; favicon: string }>,
        model?: string
    ) => void,
    onStreamStart?: () => void
) => {
    const abortRef = useRef<AbortController | null>(null);
    const previousContentRef = useRef<string>("");
    const currentTurnIdRef = useRef<string>("");

    // Memoize the fetch function to prevent recreating it
    const fetchStream = useCallback(async () => {
        if (!turnId || turnId === currentTurnIdRef.current) return;

        // Abort previous request if exists
        if (abortRef.current) {
            abortRef.current.abort();
        }

        const controller = new AbortController();
        abortRef.current = controller;
        currentTurnIdRef.current = turnId;
        previousContentRef.current = ""; // Reset for new stream

        if (onStreamStart) {
            onStreamStart();
        }

        try {
            const token = localStorage.getItem("accessToken");
            const url = `${import.meta.env.VITE_SERVER_URL}/api/turn/${turnId}/chat`;
            const response = await fetch(url, {
                method: "GET",
                headers: {
                    Authorization: token ? `Bearer ${token}` : "",
                },
                signal: controller.signal,
            });

            if (!response.body) return;

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";
            let isFirstChunk = true;

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });

                // Split on double newlines (SSE format)
                const parts = buffer.split("\n\n");
                buffer = parts.pop() || "";

                for (const part of parts) {
                    // Remove "data: " prefix if present
                    const line = part.replace(/^data:\s*/, "").trim();
                    if (!line) continue;
                    if (line === "[DONE]") {
                        if (onChunk) {
                            onChunk("", isFirstChunk, true);
                        }
                        if (onDone) onDone();
                        controller.abort();
                        return;
                    }
                    try {
                        const data = JSON.parse(line);

                        // If using chunk callback for typing animation
                        if (onChunk && data.content !== undefined) {
                            const newContent = data.content.slice(
                                previousContentRef.current.length
                            );

                            // Extract sources and model from the data
                            const sources = data.sources || [];
                            const model = data.model || undefined;

                            // ✅ FIX: Call onChunk even if no new content but has sources or is finished
                            if (newContent || data.finished || sources.length > 0) {
                                // Add artificial delay for smoother typing effect only if there's new content
                                if (newContent) {
                                    await new Promise((resolve) => setTimeout(resolve, 10));
                                }

                                onChunk(
                                    newContent,
                                    isFirstChunk,
                                    data.finished || false,
                                    sources,
                                    model
                                );

                                if (newContent) {
                                    previousContentRef.current = data.content;
                                    isFirstChunk = false;
                                }
                            }
                        } else {
                            // Fallback to original message callback
                            if (onMessage) onMessage(data);
                        }
                    } catch (e) {
                        // Ignore parse errors
                    }
                }
            }
        } catch (error) {
            if (error.name !== "AbortError") {
                console.error("Stream error:", error);
            }
        }
    }, [turnId, onMessage, onDone, onChunk, onStreamStart]);

    useEffect(() => {
        if (turnId && turnId !== currentTurnIdRef.current) {
            fetchStream();
        }

        // return () => {
        //     if (abortRef.current) {
        //         abortRef.current.abort();
        //     }
        // };
    }, [fetchStream]); // Only depend on the memoized fetchStream

    // Cleanup on unmount
    // useEffect(() => {
    //     return () => {
    //         if (abortRef.current) {
    //             abortRef.current.abort();
    //         }
    //     };
    // }, []);
};

export default useTurnChatStream;
