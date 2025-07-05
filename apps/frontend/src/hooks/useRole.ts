import { useAuth } from "@/context/AuthContext";

export const useRole = () => {
    const { user, isAuthenticated } = useAuth();

    const hasRole = (requiredRole: string | string[]): boolean => {
        if (!isAuthenticated || !user?.role) {
            return false;
        }

        const userRole = user.role.toLowerCase();

        if (Array.isArray(requiredRole)) {
            return requiredRole.some((role) => role.toLowerCase() === userRole);
        }

        return requiredRole.toLowerCase() === userRole;
    };

    const isAdmin = (): boolean => hasRole("admin");
    const isModerator = (): boolean => hasRole(["admin", "moderator"]);
    const isUser = (): boolean => hasRole(["admin", "moderator", "user"]);

    return {
        userRole: user?.role,
        hasRole,
        isAdmin,
        isModerator,
        isUser,
    };
};
