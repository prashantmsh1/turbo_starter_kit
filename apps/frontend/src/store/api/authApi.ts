import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "../store";

export interface GoogleAuthRequest {
    displayName: string;
    email: string;
    googlePhotoUrl?: string;
    firebaseUid: string;
    idToken: string;
}

export interface AuthResponse {
    success: boolean;
    message: string;
    user: {
        id: string;
        email: string;
        displayName: string;
        photoUrl?: string;
        firebaseUid: string;
        role: string;
        isActive: boolean;
    };
    accessToken: string;
    refreshToken: string;
}

const server = import.meta.env.VITE_SERVER_URL;
const baseUrl = server ? `${server}/api` : "http://localhost:3000";

console.log("Base URL for auth API:", server);
export const authApi = createApi({
    reducerPath: "authApi",
    baseQuery: fetchBaseQuery({
        baseUrl,
        prepareHeaders: (headers, { getState }) => {
            const token = (getState() as RootState).auth.accessToken;
            if (token) {
                headers.set("authorization", `Bearer ${token}`);
            }
            return headers;
        },
    }),
    tagTypes: ["Auth"],
    endpoints: (builder) => ({
        googleAuth: builder.mutation<AuthResponse, GoogleAuthRequest>({
            query: (authData) => ({
                url: "/auth/google",
                method: "POST",
                body: authData,
            }),
            invalidatesTags: ["Auth"],
        }),
        refreshToken: builder.mutation<
            { accessToken: string; refreshToken: string },
            { refreshToken: string }
        >({
            query: (body) => ({
                url: "/auth/refresh",
                method: "POST",
                body,
            }),
        }),
        logout: builder.mutation<{ success: boolean; message: string }, void>({
            query: () => ({
                url: "/auth/logout",
                method: "POST",
            }),
            invalidatesTags: ["Auth"],
        }),
        verifyToken: builder.query<{ valid: boolean; user?: any }, string>({
            query: (token) => ({
                url: "/auth/verify",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }),
            providesTags: ["Auth"],
        }),
    }),
});

export const {
    useGoogleAuthMutation,
    useRefreshTokenMutation,
    useLogoutMutation,
    useVerifyTokenQuery,
} = authApi;
