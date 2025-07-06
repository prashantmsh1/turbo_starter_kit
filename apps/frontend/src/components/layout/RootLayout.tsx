import React, { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";

import { SidebarTrigger, useSidebar } from "../ui/sidebar";
import { useAuth } from "@/context/AuthContext";
import AppSidebar from "./Sidebar";
import Navbar from "./Navbar";

interface RootLayoutProps {
    children: React.ReactNode;
}

const RootLayout: React.FC<RootLayoutProps> = ({ children }) => {
    const { open } = useSidebar();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    useEffect(() => {
        // Redirect to login if not authenticated
        if (!isAuthenticated) {
            navigate("/login", { replace: true });
        }
    }, [isAuthenticated]);

    return (
        <div className="min-h-screen flex w-screen ">
            {/* Sidebar */}
            <AppSidebar />

            <div className="flex relative w-full ">
                {/* Sidebar Trigger - Always show on mobile, show on desktop when closed */}
                <div className="md:hidden">
                    <SidebarTrigger className="absolute top-2 left-4 z-50 bg-gray-400 dark:bg-white/10 hover:bg-white/20 text-gray-900 dark:text-white border border-white/20 hover:border-white/30 rounded-lg p-2 backdrop-blur-sm transition-all duration-300 transform hover:scale-[1.05]" />
                </div>
                <div className="hidden md:block">
                    {!open && (
                        <SidebarTrigger className="absolute top-2 left-4 z-50 dark:bg-white/10 hover:bg-white/20 dark:text-white border border-white/20 hover:border-white/30 rounded-lg p-2 backdrop-blur-sm transition-all duration-300 transform hover:scale-[1.05]" />
                    )}
                </div>

                {/* Main Content Area */}
                <main className="w-full dark:bg-eerie-black/80 flex flex-col items-center    justify-center">
                    <Navbar />
                    <div className="w-full h-screen">
                        <Outlet />
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

// export default RootLayout;
export default RootLayout;
