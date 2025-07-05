import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ChatMessage } from "../api/threadApi";
import type { ThreadResponse, Thread } from "../api/threadApi";

interface ChatState {
    threads: Record<string, ThreadResponse>;
    messages: Record<string, ChatMessage[]>; // key: threadId
    currentThreadId?: string;
    allThreads: Thread[];
}

const initialState: ChatState = {
    threads: {},
    messages: {},
    allThreads: [],
    currentThreadId: undefined,
};

const chatSlice = createSlice({
    name: "chat",
    initialState,
    reducers: {
        setThread(state, action: PayloadAction<ThreadResponse>) {
            state.threads[action.payload.threadId] = action.payload;
            state.currentThreadId = action.payload.threadId;
        },
        addMessage(state, action: PayloadAction<{ threadId: string; message: ChatMessage }>) {
            if (!state.messages[action.payload.threadId]) {
                state.messages[action.payload.threadId] = [];
            }
            state.messages[action.payload.threadId].push(action.payload.message);
        },

        appendTurnsList(state, action: PayloadAction<{ threadId: string; turns: ChatMessage[] }>) {
            if (!state.messages[action.payload.threadId]) {
                state.messages[action.payload.threadId] = [];
            }
            // Append new turns to the existing messages for the thread
            state.messages[action.payload.threadId] = [
                // ...state.messages[action.payload.threadId],
                ...action.payload.turns,
            ];
        },
        // NEW: Append content to the last assistant message for typing effect
        appendToLastAssistantMessage(
            state,
            action: PayloadAction<{
                threadId: string;
                content: string;
                finished?: boolean;
                sources?: Array<{
                    title: string;
                    url: string;
                    description: string;
                    favicon: string;
                }>;
                model?: string;
            }>
        ) {
            const msgs = state.messages[action.payload.threadId];
            if (!msgs) return;

            for (let i = msgs.length - 1; i >= 0; i--) {
                if (msgs[i].type === "assistant") {
                    msgs[i].content += action.payload.content;
                    if (action.payload.finished) {
                        msgs[i].finished = true;
                    }
                    // Only update sources if provided and not empty
                    if (action.payload.sources && action.payload.sources.length > 0) {
                        msgs[i].sources = action.payload.sources;
                    }
                    if (action.payload.model) {
                        msgs[i].model = action.payload.model;
                    }
                    return;
                }
            }
        },
        updateLastAssistantMessage(
            state,
            action: PayloadAction<{ threadId: string; message: ChatMessage }>
        ) {
            const msgs = state.messages[action.payload.threadId];
            if (!msgs) return;
            // Find last assistant message by id or type
            for (let i = msgs.length - 1; i >= 0; i--) {
                if (msgs[i].type === "assistant") {
                    msgs[i] = { ...msgs[i], ...action.payload.message };
                    return;
                }
            }
        },
        clearMessages(state, action: PayloadAction<string>) {
            state.messages[action.payload] = [];
        },
        setCurrentThreadId(state, action: PayloadAction<string>) {
            state.currentThreadId = action.payload;
        },

        setAllThreads(state, action: PayloadAction<Thread[]>) {
            state.allThreads = action.payload;
        },
        addThread(state, action: PayloadAction<Thread>) {
            state.allThreads.push(action.payload);
        },
    },
});

export const {
    setThread,
    addMessage,
    clearMessages,
    setCurrentThreadId,
    updateLastAssistantMessage,
    appendToLastAssistantMessage,
    appendTurnsList,
    setAllThreads,
    addThread,
} = chatSlice.actions;
export default chatSlice.reducer;
