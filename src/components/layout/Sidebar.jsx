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
  CheckCircle2
} from 'lucide-react';

export function Sidebar({ portalType }) {
  const location = useLocation();
  const pathname = location.pathname;

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
      title: 'Manage Vendors',
      href: '/company/manage-vendors',
      icon: <Users className="h-5 w-5" />,
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

  const navItems = portalType === 'company' ? companyNavItems : vendorNavItems;
  const activeColor = portalType === 'company' ? 'bg-blue-50 text-blue-600 border-blue-600' : 'bg-emerald-50 text-emerald-600 border-emerald-600';
  const hoverColor = portalType === 'company' ? 'hover:bg-blue-50 hover:text-blue-600' : 'hover:bg-emerald-50 hover:text-emerald-600';

  return (
    <aside className="w-64 min-h-[calc(100vh-4rem)] border-r bg-slate-50">
      <nav className="p-4 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/company/dashboard' && item.href !== '/vendor/dashboard' && pathname.startsWith(item.href));

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
    </aside>
  );
}
