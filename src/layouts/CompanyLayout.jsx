import { useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '@/lib/context/AuthContext';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';

export default function CompanyLayout() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Don't apply protection to login page
  const isLoginPage = location.pathname === '/company/login';

  useEffect(() => {
    if (isLoginPage) return;
    
    if (!isAuthenticated) {
      navigate('/company/login');
    } else if (user?.portalType !== 'company') {
      navigate('/vendor/dashboard');
    }
  }, [isAuthenticated, user, navigate, isLoginPage]);

  // Render login page without layout
  if (isLoginPage) {
    return <Outlet />;
  }

  if (!isAuthenticated || user?.portalType !== 'company') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <Header portalType="company" />
      <div className="flex">
        <Sidebar portalType="company" />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
