import { useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '@/lib/context/AuthContext';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';

export default function VendorLayout() {
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const isLoginPage = location.pathname === '/vendor/login';

    useEffect(() => {
        if (isLoginPage) return;

        if (!isAuthenticated) {
            navigate('/vendor/login');
        } else if (user?.portalType !== 'vendor') {
            navigate('/company/dashboard');
        }
    }, [isAuthenticated, user, navigate, isLoginPage]);

    // Render login page without layout
    if (isLoginPage) {
        return <Outlet />;
    }

    if (!isAuthenticated || user?.portalType !== 'vendor') {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-100">
            <Header portalType="vendor" />
            <div className="flex">
                <Sidebar portalType="vendor" />
                <main className="flex-1 p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
