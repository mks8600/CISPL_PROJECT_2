import { Navigate, Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/context/AuthContext';
import { Sidebar } from '@/components/layout/Sidebar';
import { Button } from '@/components/ui/button';
import { ShieldAlert, LogOut } from 'lucide-react';

export default function SuperAdminLayout() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  if (!isAuthenticated || user?.portalType !== 'superadmin') {
    return <Navigate to="/superadmin/login" replace />;
  }

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Navbar */}
      <header className="h-16 border-b bg-purple-900 px-4 md:px-6 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="bg-white/10 p-2 rounded-lg">
            <ShieldAlert className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-white text-lg tracking-tight hidden sm:inline-block">Crystal</span>
            <span className="font-normal text-purple-200 ml-1">Super Admin</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-sm font-medium text-white">{user.name}</span>
            <span className="text-xs text-purple-300">Master Controller</span>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-purple-200 hover:text-white hover:bg-white/10"
          >
            <LogOut className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </header>

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
