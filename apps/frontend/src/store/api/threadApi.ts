import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export interface ThreadResponse {
    threadId: string;
    turnId: string;
    message: string;
    threadTitle: string;
    userId: string;
}

export interface ChatMessage {
    id: number;
    type: "user" | "assistant";
    content: string;
    timestamp: string;
    finished?: boolean;
    model?: string;
    sources?: Array<{
        title: string;
        url: string;
        description: string;
        favicon: string;
    }>;
    usage?: any;
    finishReason?: string;
    error?: string;
}
export interface Turn {
    id: string;
    threadId: string;
    userId: string;
    createdAt: string;
    updatedAt: string;
    messages: ChatMessage[];
}

export interface Thread {
    id: string;
    title: string;
    userId: string;
    createdAt: string;
    updatedAt: string;
    turns: Turn[];
}

export const chatApi = createApi({
    reducerPath: "chatApi",
    baseQuery: fetchBaseQuery({
        baseUrl: import.meta.env.VITE_SERVER_URL + "/api", // Adjust as needed
        credentials: "include",
        prepareHeaders: (headers, { getState }) => {
            const token = (getState() as any).auth.accessToken; // Adjust based on your auth state
            if (token) {
                headers.set("authorization", `Bearer ${token}`);
            }
            return headers;
        },
    }),
    endpoints: (builder) => ({
        initiateThread: builder.mutation<ThreadResponse, { prompt: string; threadId?: string }>({
            query: (body) => ({
                url: "/thread/initiate",
                method: "POST",
                body,
            }),
        }),
        // For SSE, we use a custom queryFn
        getTurnChat: builder.query<ChatMessage[], { turnId: string }>({
            // This will be handled by a custom hook, not fetchBaseQuery
            async queryFn({ turnId }) {
                // This is a placeholder; see the custom hook below for actual SSE handling
                return { data: [] };
            },
            // No cache for SSE
            providesTags: [],
        }),

        getAllThreads: builder.query<Thread[], void>({
            query: () => ({
                url: "/thread/all",
                method: "GET",
            }),
            providesTags: (result) =>
                result ? result.map(({ id }) => ({ type: "Thread" as const, id })) : [],
        }),

        getThreadTurnsById: builder.query<ChatMessage[], { threadId: string }>({
            query: ({ threadId }) => ({
                url: `/thread/turns/${threadId}`,
                method: "GET",
            }),

            transformResponse(baseQueryReturnValue: Thread) {
                // Only return the turns array from the Thread object
                return baseQueryReturnValue.turns;
            },
        }),
    }),
});

export const {
    useInitiateThreadMutation,
    useLazyGetTurnChatQuery,
    useGetAllThreadsQuery,
    useGetThreadTurnsByIdQuery,
} = chatApi;
