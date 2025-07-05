export const clearAuthData = () => {
    try {
        // Clear specific auth items
        const authKeys = [
            "user",
            "accessToken",
            "refreshToken",
            "firebaseUser",
            "firebase:authUser:", // Firebase might store user data with this prefix
        ];

        authKeys.forEach((key) => {
            localStorage.removeItem(key);
        });

        // Clear any items that start with firebase auth prefixes
        Object.keys(localStorage).forEach((key) => {
            if (key.startsWith("firebase:") || key.startsWith("CookieConsentPolicy")) {
                localStorage.removeItem(key);
            }
        });

        // Clear session storage as well
        sessionStorage.clear();
    } catch (error) {
        console.warn("Failed to clear auth data:", error);
    }
};

export const isAuthDataStored = (): boolean => {
    try {
        const user = localStorage.getItem("user");
        const accessToken = localStorage.getItem("accessToken");
        const refreshToken = localStorage.getItem("refreshToken");

        return !!(user && accessToken && refreshToken);
    } catch (error) {
        return false;
    }
};
