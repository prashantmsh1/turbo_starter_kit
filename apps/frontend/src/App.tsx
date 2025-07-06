import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./App.css";
import { SidebarProvider } from "./components/ui/sidebar";
import { AuthProvider } from "./context/AuthContext";
import { useEffect } from "react";
import { Provider } from "react-redux";
import { store } from "./store/store";
import RootLayout from "./components/layout/RootLayout";
import MainDashboard from "./pages/dashboard/MainDashboard";
import { ThemeProvider } from "./context/ThemeProvider";

function App() {
    useEffect(() => {
        // document.documentElement.classList.add("dark");
    }, []);

    const router = createBrowserRouter([
        {
            path: "/",
            element: <div>demo</div>,
        },
        {
            path: "/dashboard",
            element: (
                <RootLayout>
                    <MainDashboard />
                </RootLayout>
            ),
        },
    ]);
    return (
        <Provider store={store}>
            <AuthProvider>
                <ThemeProvider>
                    <SidebarProvider>
                        <RouterProvider router={router} />
                    </SidebarProvider>
                </ThemeProvider>
            </AuthProvider>
        </Provider>
    );
}

export default App;
