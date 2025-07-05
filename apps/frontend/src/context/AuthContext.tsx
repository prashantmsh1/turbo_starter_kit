import React, { createContext, useContext, useEffect, ReactNode, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../store/store";
import { setCredentials, logout, setLoading, setError, clearError } from "@/store/slice/authSlice";
import { auth, googleProvider } from "@/firebase/config";
import {
    signInWithPopup,
    signInWithRedirect,
    signOut,
    onAuthStateChanged,
    getRedirectResult,
    User as FirebaseUser,
    getIdToken,
} from "firebase/auth";
import { useGoogleAuthMutation, useLogoutMutation } from "../store/api/authApi";
import { useToast } from "@/hooks/use-toast";
import { clearAuthData } from "@/utils/authUtils";
import { Navigate, useNavigate } from "react-router-dom";

interface AuthContextType {
    user: any;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (user: any, accessToken: string, refreshToken: string) => void;
    logout: () => Promise<void>;
    signInWithGoogle: () => Promise<void>;
    clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const dispatch = useDispatch();
    const { toast } = useToast();
    const { user, isAuthenticated, isLoading, error } = useSelector(
        (state: RootState) => state.auth
    );
    const [googleAuth] = useGoogleAuthMutation();
    const [logoutMutation] = useLogoutMutation();

    // Add refs to track initialization state
    const isInitialized = useRef(false);
    const isFirebaseUserProcessing = useRef(false);

    // Handle Firebase user authentication
    const handleFirebaseUser = async (firebaseUser: FirebaseUser | null) => {
        // Prevent processing if already processing or if user is already authenticated with same uid
        if (isFirebaseUserProcessing.current) {
            return;
        }

        if (firebaseUser) {
            // Check if we already have this user authenticated
            if (isAuthenticated && user?.firebaseUid === firebaseUser.uid) {
                return; // Already authenticated with this user, no need to call API
            }

            try {
                isFirebaseUserProcessing.current = true;
                dispatch(setLoading(true));

                // Get ID token from Firebase
                const idToken = await getIdToken(firebaseUser);

                // Send user data to your backend
                const result = await googleAuth({
                    displayName: firebaseUser.displayName || firebaseUser.email || "",
                    email: firebaseUser.email || "",
                    googlePhotoUrl: firebaseUser.photoURL || "",
                    firebaseUid: firebaseUser.uid,
                    idToken: idToken,
                }).unwrap();

                if (!result.user || !result.accessToken || !result.refreshToken) {
                    toast({
                        title: "Authentication Failed",
                        description: "Failed to retrieve user data",
                        variant: "destructive",
                    });
                }

                dispatch(
                    setCredentials({
                        user: result.user,
                        accessToken: result.accessToken,
                        refreshToken: result.refreshToken,
                    })
                );
                <Navigate to={"/chatpage"} />;
                // window.location.href = "/chat"; // Redirect to chat page after successful login
                toast({
                    title: "Success",
                    description: result.message,
                });
            } catch (error: any) {
                console.error("Authentication error:", error);
                dispatch(setError(error.data?.message || "Authentication failed"));
                toast({
                    title: "Authentication Failed",
                    description:
                        error.data?.message || "Something went wrong during authentication",
                    variant: "destructive",
                });
            } finally {
                dispatch(setLoading(false));
                isFirebaseUserProcessing.current = false;
            }
        } else {
            // User signed out
            if (isAuthenticated) {
                dispatch(logout());
            }
        }
    };

    useEffect(() => {
        // Prevent multiple initializations
        if (isInitialized.current) {
            return;
        }

        isInitialized.current = true;

        // Check for stored user data on app load
        const storedUser = localStorage.getItem("user");
        const storedAccessToken = localStorage.getItem("accessToken");
        const storedRefreshToken = localStorage.getItem("refreshToken");

        if (storedUser && storedAccessToken && storedRefreshToken) {
            try {
                const parsedUser = JSON.parse(storedUser);
                dispatch(
                    setCredentials({
                        user: parsedUser,
                        accessToken: storedAccessToken,
                        refreshToken: storedRefreshToken,
                    })
                );
                console.log("Restored user from localStorage:", parsedUser);
            } catch (error) {
                console.error("Failed to parse stored user data:", error);
                // // Clear corrupted data
                localStorage.removeItem("user");
                localStorage.removeItem("accessToken");
                localStorage.removeItem("refreshToken");
            }
        }

        // Listen for auth state changes from Firebase
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            // Only process if we have stored credentials or if there's a Firebase user
            if (firebaseUser || !storedUser) {
                handleFirebaseUser(firebaseUser);
            }
        });

        // Handle redirect result for mobile devices
        getRedirectResult(auth)
            .then((result) => {
                if (result?.user) {
                    handleFirebaseUser(result.user);
                }
            })
            .catch((error) => {
                console.error("Redirect result error:", error);
                dispatch(setError("Authentication redirect failed"));
                toast({
                    title: "Authentication Error",
                    description: "Failed to complete authentication redirect",
                    variant: "destructive",
                });
            });

        return () => {
            unsubscribe();
            isInitialized.current = false;
        };
    }, []); // Remove dependencies to prevent re-running

    const login = (user: any, accessToken: string, refreshToken: string) => {
        dispatch(setCredentials({ user, accessToken, refreshToken }));
    };

    useEffect(() => {
        if (isAuthenticated) {
            <Navigate to="/chatpage" />;
        } else {
            <Navigate to={"/login"} />;
        }
    }, [isAuthenticated]);

    const handleLogout = async () => {
        try {
            dispatch(setLoading(true));

            // Call backend logout if user is authenticated
            if (isAuthenticated) {
                try {
                    const result = await logoutMutation().unwrap();
                } catch (error) {
                    // Continue with logout even if backend call fails
                    console.warn("Backend logout failed:", error);
                }
            }

            // Sign out from Firebase
            await signOut(auth);

            // Clear all auth data
            clearAuthData();
            // Force clear Redux state
            <Navigate to={"/login"} />;
            dispatch(logout());

            toast({
                title: "Success",
                description: "Logged out successfully",
            });
        } catch (error: any) {
            console.error("Logout error:", error);
            // Force logout even if Firebase signOut fails
            clearAuthData();
            dispatch(logout());

            toast({
                title: "Warning",
                description: "Logged out with some issues",
                variant: "destructive",
            });
        } finally {
            dispatch(setLoading(false));
        }
    };

    const signInWithGoogle = async () => {
        try {
            dispatch(setLoading(true));
            dispatch(clearError());

            // Check if we're on mobile device
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
                navigator.userAgent
            );

            if (isMobile) {
                // Use redirect for mobile devices
                await signInWithRedirect(auth, googleProvider);
            } else {
                // Use popup for desktop
                const result = await signInWithPopup(auth, googleProvider);
                if (result.user) {
                    await handleFirebaseUser(result.user);
                }
            }
        } catch (error: any) {
            console.error("Google sign-in error:", error);

            let errorMessage = "Failed to sign in with Google";

            // Handle specific Firebase auth errors
            switch (error.code) {
                case "auth/popup-blocked":
                    errorMessage = "Popup was blocked. Please allow popups and try again.";
                    break;
                case "auth/popup-closed-by-user":
                    errorMessage = "Sign-in was cancelled.";
                    break;
                case "auth/cancelled-popup-request":
                    errorMessage = "Another popup is already open.";
                    break;
                case "auth/network-request-failed":
                    errorMessage = "Network error. Please check your connection.";
                    break;
                default:
                    errorMessage = error.message || errorMessage;
            }

            dispatch(setError(errorMessage));
            toast({
                title: "Sign-in Failed",
                description: errorMessage,
                variant: "destructive",
            });
        } finally {
            dispatch(setLoading(false));
        }
    };

    const clearAuthError = () => {
        dispatch(clearError());
    };

    const value = {
        user,
        isAuthenticated,
        isLoading,
        login,
        logout: handleLogout,
        signInWithGoogle,
        clearAuthError,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};

export { AuthContext };
