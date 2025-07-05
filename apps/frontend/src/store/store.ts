import { configureStore } from "@reduxjs/toolkit";
import { contactApi } from "./api/contactApi";
import { authApi } from "./api/authApi";
import authReducer from "./slice/authSlice";
import chatReducer from "./slice/threadSlice";
import { chatApi } from "./api/threadApi";
import { persistReducer, persistStore } from "redux-persist";
import storage from "redux-persist/lib/storage";

const authPersistConfig = {
    key: "auth",
    storage,
};

const persistedAuthReducer = persistReducer(authPersistConfig, authReducer);

export const store = configureStore({
    reducer: {
        [contactApi.reducerPath]: contactApi.reducer,
        [authApi.reducerPath]: authApi.reducer,
        [chatApi.reducerPath]: chatApi.reducer,
        auth: persistedAuthReducer,
        chat: chatReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: [
                    "persist/PERSIST",
                    "persist/REHYDRATE",
                    "persist/PAUSE",
                    "persist/FLUSH",
                    "persist/PURGE",
                    "persist/REGISTER",
                ],
            },
        })
            .concat(contactApi.middleware)
            .concat(authApi.middleware)
            .concat(chatApi.middleware),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
