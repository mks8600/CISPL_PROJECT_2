import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  ClipboardList,
  PlusCircle,
  Package,
  Briefcase,
  Users,
  TrendingUp,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Building2,
  Menu,
  X,
  Calculator
} from 'lucide-react';

export function Sidebar({ portalType }) {
  const location = useLocation();
  const pathname = location.pathname;
  const [isOpen, setIsOpen] = useState(false);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Close sidebar on escape key
  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') setIsOpen(false); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const companyNavItems = [
    {
      title: 'Dashboard',
      href: '/company/dashboard',
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      title: 'Work Orders',
      href: '/company/orders',
      icon: <ClipboardList className="h-5 w-5" />,
    },
    {
      title: 'Create Order',
      href: '/company/orders/create',
      icon: <PlusCircle className="h-5 w-5" />,
    },
    {
      title: 'Manage Job No',
      href: '/company/manage-job',
      icon: <Briefcase className="h-5 w-5" />,
    },
    {
      title: 'Order Status',
      href: '/company/order-status',
      icon: <Activity className="h-5 w-5" />,
    },
    {
      title: 'Pending Work',
      href: '/company/pending-work',
      icon: <AlertTriangle className="h-5 w-5" />,
    },
    {
      title: 'Completed Works',
      href: '/company/completed-work',
      icon: <CheckCircle2 className="h-5 w-5" />,
    },
    {
      title: 'Billing',
      href: '/company/billing',
      icon: <Calculator className="h-5 w-5" />,
    },
  ];

  const vendorNavItems = [
    {
      title: 'Dashboard',
      href: '/vendor/dashboard',
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      title: 'My Orders',
      href: '/vendor/orders',
      icon: <Package className="h-5 w-5" />,
    },
    {
      title: 'Reassigned Tasks',
      href: '/vendor/reassigned-tasks',
      icon: <AlertTriangle className="h-5 w-5" />,
    },
    {
      title: 'Order Progress',
      href: '/vendor/order-progress',
      icon: <TrendingUp className="h-5 w-5" />,
    },
  ];

  const superAdminNavItems = [
    {
      title: 'Dashboard',
      href: '/superadmin/dashboard',
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      title: 'Manage Organizations',
      href: '/superadmin/organizations',
      icon: <Building2 className="h-5 w-5" />,
    },
    {
      title: 'Global Vendors',
      href: '/superadmin/vendors',
      icon: <Users className="h-5 w-5" />,
    },
  ];

  const navItems = portalType === 'superadmin' ? superAdminNavItems : (portalType === 'company' ? companyNavItems : vendorNavItems);
  const activeColor = portalType === 'superadmin' ? 'bg-purple-50 text-purple-600 border-purple-600' : (portalType === 'company' ? 'bg-blue-50 text-blue-600 border-blue-600' : 'bg-emerald-50 text-emerald-600 border-emerald-600');
  const hoverColor = portalType === 'superadmin' ? 'hover:bg-purple-50 hover:text-purple-600' : (portalType === 'company' ? 'hover:bg-blue-50 hover:text-blue-600' : 'hover:bg-emerald-50 hover:text-emerald-600');
  const accentColor = portalType === 'superadmin' ? 'text-purple-600' : (portalType === 'company' ? 'text-blue-600' : 'text-emerald-600');

  const navContent = (
    <nav className="p-4 space-y-2">
      {navItems.map((item) => {
        const isActive = pathname === item.href ||
          (item.href !== '/company/dashboard' && item.href !== '/vendor/dashboard' && item.href !== '/superadmin/dashboard' && pathname.startsWith(item.href));

        return (
          <Link
            key={item.href}
            to={item.href}
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors border-l-4 border-transparent',
              isActive ? activeColor : `text-slate-600 ${hoverColor}`
            )}
          >
            {item.icon}
            {item.title}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "md:hidden fixed bottom-4 right-4 z-50 p-3 rounded-full shadow-lg transition-all active:scale-95",
          portalType === 'superadmin' ? 'bg-purple-600 text-white' :
          portalType === 'company' ? 'bg-blue-600 text-white' :
          'bg-emerald-600 text-white'
        )}
        aria-label="Open navigation"
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile sidebar drawer */}
      <aside
        className={cn(
          "md:hidden fixed top-0 left-0 h-full w-72 bg-white z-50 shadow-xl transform transition-transform duration-300 ease-in-out",
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <span className={cn("font-bold text-lg", accentColor)}>Navigation</span>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>
        {navContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden md:block w-64 min-h-[calc(100vh-4rem)] border-r bg-slate-50 shrink-0">
        {navContent}
      </aside>
    </>
  );
}
