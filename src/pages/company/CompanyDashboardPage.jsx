import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import {
  ClipboardList,
  Clock,
  PlayCircle,
  CheckCircle2,
  PlusCircle,
  FileText,
  XCircle,
  Eye
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { dashboardApi } from '@/lib/api/client';

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

export default function CompanyDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalAssignments: 0,
    pendingOrders: 0,
    inProgress: 0,
    completedOrders: 0,
    declinedOrders: 0,
    totalSheets: 0,
    awaitingReview: 0,
    recentAssignments: [],
  });

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const dashboardData = await dashboardApi.company();
        setStats(dashboardData);
      } catch (err) {
        toast.error('Failed to load dashboard data');
      }
    };

    if (user?.companyId) {
      loadDashboard();
      window.addEventListener('focus', loadDashboard);
      return () => window.removeEventListener('focus', loadDashboard);
    }
  }, [user?.companyId]);

  const statCards = [
    {
      title: 'Total Assigned',
      value: stats.totalAssignments,
      description: 'All orders sent to vendors',
      icon: ClipboardList,
      color: 'text-blue-600',
      bgColor: 'bg-blue-500/10 border border-blue-500/10',
    },
    {
      title: 'Pending Response',
      value: stats.pendingOrders,
      description: 'Awaiting vendor acceptance',
      icon: Clock,
      color: 'text-amber-600',
      bgColor: 'bg-amber-500/10 border border-amber-500/10',
    },
    {
      title: 'In Progress',
      value: stats.inProgress,
      description: 'Accepted, work ongoing',
      icon: PlayCircle,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-500/10 border border-indigo-500/10',
    },
    {
      title: 'Awaiting Review',
      value: stats.awaitingReview,
      description: 'Submitted by vendor',
      icon: Eye,
      color: 'text-purple-600',
      bgColor: 'bg-purple-500/10 border border-purple-500/10',
    },
    {
      title: 'Submitted',
      value: stats.completedOrders,
      description: 'Vendor work submitted',
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-500/10 border border-emerald-500/10',
    },
    {
      title: 'Declined',
      value: stats.declinedOrders,
      description: 'Rejected by vendor',
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-500/10 border border-red-500/10',
    },
    {
      title: 'Saved Sheets',
      value: stats.totalSheets,
      description: 'Requisition sheets created',
      icon: FileText,
      color: 'text-slate-600',
      bgColor: 'bg-slate-500/10 border border-slate-500/10',
    },
  ];

  const recentAssignments = stats.recentAssignments || [];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome back, {user?.name}
          </h1>
          <p className="text-slate-500">
            Here&apos;s an overview of your work orders
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild className="bg-blue-600 hover:bg-blue-700">
            <Link to="/company/orders/create" className="flex items-center gap-2">
              <PlusCircle className="h-4 w-4" />
              Create Order
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="hover:scale-[1.02] hover:shadow-md hover:border-slate-300 transition-all duration-300">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{stat.title}</p>
                  <p className="text-3xl font-extrabold text-slate-900 mt-1">{stat.value}</p>
                  <p className="text-[11px] text-slate-400 mt-1">{stat.description}</p>
                </div>
                <div className={`p-3 rounded-2xl ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Assignments */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Assignments</CardTitle>
            <CardDescription>Latest 5 orders assigned to vendors</CardDescription>
          </div>
          <Button variant="ghost" asChild>
            <Link to="/company/order-status">View All</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recentAssignments.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <ClipboardList className="h-12 w-12 mx-auto mb-4 text-slate-300" />
              <p>No assignments yet</p>
              <Button asChild className="mt-4">
                <Link to="/company/orders/create">Create your first order</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentAssignments.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between py-3 px-4 bg-slate-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-slate-800 flex items-center gap-2">
                      {order.rs_no && <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-200">RS {order.rs_no}</span>}
                      {order.job_no || '—'}
                    </p>
                    <p className="text-sm text-slate-500 mt-0.5">
                      Vendor: <span className="font-medium text-slate-700">{order.vendor_name || '—'}</span>
                      {order.vendor_no && <span className="text-slate-400"> ({order.vendor_no})</span>}
                      {order.sheet_date && <span className="text-slate-400"> • {formatDate(order.sheet_date)}</span>}
                    </p>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    order.submitted ? 'bg-green-100 text-green-800' :
                    order.status === 'accepted' ? 'bg-blue-100 text-blue-800' :
                    order.status === 'declined' ? 'bg-red-100 text-red-800' :
                    'bg-amber-100 text-amber-800'
                  }`}>
                    {order.submitted ? 'Submitted' :
                     order.status === 'accepted' ? 'In Progress' :
                     order.status === 'declined' ? 'Declined' : 'Pending'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
