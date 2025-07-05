import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { useSelector } from "react-redux";

const LoginForm = () => {
    const { signInWithGoogle, isLoading, isAuthenticated, error, clearAuthError } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (isAuthenticated) {
            navigate("/chatpage");
        }
    }, [isAuthenticated, navigate]);

    useEffect(() => {
        // Clear any existing errors when component mounts
        clearAuthError();
    }, [clearAuthError]);

    const handleGoogleSignIn = async () => {
        await signInWithGoogle();
    };

    return (
        <div className="min-h-screen flex items-center w-screen justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
            <div className="absolute inset-0 bg-gradient-to-br from-background via-background/80 to-background"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_rgba(255,255,255,0.05)_1px,_transparent_0)] bg-[length:32px_32px] opacity-30"></div>

            <div className="relative max-w-md w-full space-y-8">
                {/* Clean card design matching homepage theme */}
                <div className="bg-card/60 backdrop-blur-xl border border-border rounded-2xl p-8 shadow-2xl">
                    <div className="text-center">
                        <div className="mx-auto h-16 w-16 bg-secondary rounded-2xl flex items-center justify-center mb-6 shadow-lg border border-border">
                            <img src="/evoke.svg" className="w-8 h-8" />
                        </div>
                        <h2 className="text-3xl font-light text-foreground mb-2">Welcome Back</h2>
                        <p className="text-muted-foreground text-sm font-light">
                            Sign in to continue to Evoke AI
                        </p>
                    </div>

                    {error && (
                        <Alert
                            variant="destructive"
                            className="mt-6 bg-destructive/20 border-destructive/30 backdrop-blur-sm">
                            <AlertDescription className="text-destructive-foreground/80">
                                {error}
                            </AlertDescription>
                        </Alert>
                    )}

                    <div className="mt-8">
                        <Button
                            onClick={() => handleGoogleSignIn()}
                            disabled={isLoading}
                            className="group relative w-full bg-secondary hover:bg-accent text-secondary-foreground border border-border hover:border-border/80 rounded-xl py-4 px-6 font-light transition-all duration-300 transform hover:scale-[1.02] backdrop-blur-sm disabled:opacity-50 disabled:hover:scale-100">
                            <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>

                            {isLoading ? (
                                <div className="flex items-center justify-center">
                                    <Loader2 className="animate-spin mr-3 h-5 w-5 text-foreground" />
                                    <span className="text-foreground">Signing in...</span>
                                </div>
                            ) : (
                                <div className="flex items-center font-light justify-center">
                                    <svg
                                        className="w-5 h-5 mr-3 text-foreground"
                                        viewBox="0 0 24 24">
                                        <path
                                            fill="currentColor"
                                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                        />
                                        <path
                                            fill="currentColor"
                                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                        />
                                        <path
                                            fill="currentColor"
                                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                        />
                                        <path
                                            fill="currentColor"
                                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                        />
                                    </svg>
                                    <span className="text-foreground font-light text-md">
                                        Continue with Google
                                    </span>
                                </div>
                            )}
                        </Button>
                    </div>

                    <div className="mt-8 text-center">
                        <p className="text-xs text-muted-foreground font-light">
                            By continuing, you agree to our{" "}
                            <span className="text-foreground/80 hover:text-foreground cursor-pointer transition-colors">
                                Terms of Service
                            </span>{" "}
                            and{" "}
                            <span className="text-foreground/80 hover:text-foreground cursor-pointer transition-colors">
                                Privacy Policy
                            </span>
                        </p>
                    </div>
                </div>

                {/* Subtle decorative elements */}
                <div className="absolute -top-8 -left-8 w-32 h-32 bg-white/5 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-8 -right-8 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>
            </div>
        </div>
    );
};

export default LoginForm;
