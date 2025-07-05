import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./App.css";
import { SidebarProvider } from "./components/ui/sidebar";
import { AuthProvider } from "./context/AuthContext";
import { useEffect } from "react";
import { Provider } from "react-redux";
import { store } from "./store/store";

function App() {
    useEffect(() => {
        // document.documentElement.classList.add("dark");
    }, []);

    const router = createBrowserRouter([
        {
            path: "/",
            element: <div>Demo</div>,
        },
    ]);
    return (
        <Provider store={store}>
            <AuthProvider>
                <SidebarProvider>
                    <RouterProvider router={router} />
                </SidebarProvider>
            </AuthProvider>
        </Provider>
    );
}

export default App;
