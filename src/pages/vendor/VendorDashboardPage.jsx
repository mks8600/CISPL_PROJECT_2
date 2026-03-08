import { useAuth } from '@/lib/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Package, TrendingUp, Clock, AlertCircle } from 'lucide-react';

export default function VendorDashboardPage() {
    const { user } = useAuth();

    const stats = [
        {
            title: 'Active Orders',
            value: '12',
            description: 'Currently processing',
            icon: Package,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
        },
        {
            title: 'Completed This Month',
            value: '45',
            description: '+15% from last month',
            icon: TrendingUp,
            color: 'text-emerald-600',
            bgColor: 'bg-emerald-50',
        },
        {
            title: 'Average Fulfillment',
            value: '4.2 days',
            description: 'On-time delivery rate: 98%',
            icon: Clock,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50',
        },
        {
            title: 'Pending Action',
            value: '3',
            description: 'Orders require update',
            icon: AlertCircle,
            color: 'text-amber-600',
            bgColor: 'bg-amber-50',
        },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">
                    Welcome back, {user?.name || 'Vendor'}
                </h1>
                <p className="text-slate-500">Here's an overview of your operations today.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                        <Card key={i}>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between space-y-0 pb-2">
                                    <p className="text-sm font-medium text-slate-500">
                                        {stat.title}
                                    </p>
                                    <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                                        <Icon className={`h-4 w-4 ${stat.color}`} />
                                    </div>
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
                                    <p className="text-xs text-slate-500 mt-1">
                                        {stat.description}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Placeholder for future detailed orders list component */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Assigned Orders</CardTitle>
                    <CardDescription>View your most recent job assignments from the company</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="py-12 text-center text-slate-500 bg-slate-50 rounded border border-dashed">
                        <p>Order tracking capabilities coming soon to the Vendor Portal.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
