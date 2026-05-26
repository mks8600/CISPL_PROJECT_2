import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/lib/context/AuthContext';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';

export default function SuperAdminLayout() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || user?.portalType !== 'superadmin') {
    return <Navigate to="/superadmin/login" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <Header portalType="superadmin" />
      <div className="flex">
        {/* Sidebar */}
        <Sidebar portalType="superadmin" />

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-8 overflow-auto h-[calc(100vh-4rem)]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
