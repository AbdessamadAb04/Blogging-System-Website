import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { authService } from '../services/authService';
import type { AuthStatus } from '../services/authService';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredRole?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
    const [auth, setAuth] = useState<AuthStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const location = useLocation();

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const status = await authService.getAuthStatus();
                setAuth(status);
            } catch (error) {
                console.error('ProtectedRoute: Auth check failed', error);
                setAuth({ isAuthenticated: false });
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0077B6]"></div>
            </div>
        );
    }

    if (!auth?.isAuthenticated) {
        // Redirect to signin, but save the current location they were trying to go to
        return <Navigate to="/signin" state={{ from: location }} replace />;
    }

    if (requiredRole && auth.user?.role !== requiredRole) {
        // If authenticated but doesn't have the required role, redirect to home
        console.warn(`ProtectedRoute: Access denied. Required: ${requiredRole}, Found: ${auth.user?.role}`);
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;
