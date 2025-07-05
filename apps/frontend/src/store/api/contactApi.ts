import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export interface ContactFormData {
    name: string;
    email: string;
    company?: string;
    projectType: string;
    budget?: string;
    message: string;
    status?: "NEW" | "CONTACTED" | "IN_PROGRESS" | "COMPLETED" | "REJECTED";
}

export interface ContactFormResponse {
    success: boolean;
    message: string;
    data?: {
        id: string;
        name: string;
        email: string;
        company?: string;
        projectType: string;
        budget?: string;
        message: string;
        createdAt: string;
        status: "NEW" | "CONTACTED" | "IN_PROGRESS" | "COMPLETED" | "REJECTED";
    };
    errors?: Array<{
        field: string;
        message: string;
    }>;
}

export const contactApi = createApi({
    reducerPath: "contactApi",
    baseQuery: fetchBaseQuery({
        baseUrl: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
    }),
    tagTypes: ["Contact"],
    endpoints: (builder) => ({
        submitContactForm: builder.mutation<ContactFormResponse, ContactFormData>({
            query: (formData) => ({
                url: "/contact/save",
                method: "POST",
                body: formData,
            }),
            invalidatesTags: ["Contact"],
        }),
        getContacts: builder.query<
            {
                success: boolean;
                data: ContactFormData[];
                total: number;
            },
            void
        >({
            query: () => "/contact/data",
            providesTags: ["Contact"],
        }),

        updateContact: builder.mutation<
            { success: boolean; message: string; data?: ContactFormData },
            { id: string; formData: Partial<ContactFormData> }
        >({
            query: ({ id, formData }) => ({
                url: `/contact/update/${id}`,
                method: "PATCH",
                body: formData,
            }),
            invalidatesTags: (result, error, { id }) => [{ type: "Contact", id }],
        }),

        changeContactStatus: builder.mutation<
            { success: boolean; message: string },
            { id: string; status: "NEW" | "CONTACTED" | "IN_PROGRESS" | "COMPLETED" | "REJECTED" }
        >({
            query: ({ id, status }) => ({
                url: `/contact/status/${id}`,
                method: "PATCH",
                body: { status },
            }),
            invalidatesTags: (result, error, { id }) => [{ type: "Contact", id }],
        }),
    }),
});

export const {
    useSubmitContactFormMutation,
    useGetContactsQuery,
    useChangeContactStatusMutation,
    useUpdateContactMutation,
} = contactApi;
