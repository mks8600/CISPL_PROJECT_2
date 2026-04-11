import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Package, TrendingUp, Clock, AlertCircle, Film, Trash2, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { dashboardApi, filmSizesApi } from '@/lib/api/client';
import { toast } from 'sonner';

export default function VendorDashboardPage() {
    const { user } = useAuth();
    const [statsData, setStatsData] = useState({
        totalOrders: 0,
        pendingOrders: 0,
        inProgress: 0,
        completedOrders: 0,
        recentOrders: []
    });

    const [filmSizes, setFilmSizes] = useState([]);
    const [newFilmSize, setNewFilmSize] = useState('');

    useEffect(() => {
        if (!user) return;
        const load = async () => {
            try {
                const [dashRes, sizesRes] = await Promise.all([
                    dashboardApi.vendor(),
                    filmSizesApi.list()
                ]);
                setStatsData(dashRes);
                setFilmSizes(sizesRes); // Assuming it returns an array of objects like { id, size }
            } catch (err) {
                console.error('Failed to load dashboard', err);
            }
        };
        load();
        window.addEventListener('focus', load);
        return () => window.removeEventListener('focus', load);
    }, [user]);

    const handleAddFilmSize = async (e) => {
        e.preventDefault();
        const trimmed = newFilmSize.trim();
        if (!trimmed) return;
        try {
            const res = await filmSizesApi.create({ size: trimmed });
            setFilmSizes([...filmSizes, res]);
            setNewFilmSize('');
        } catch (err) {
            toast.error(err.message || 'Failed to add film size');
        }
    };

    const handleRemoveFilmSize = async (sizeObj) => {
        try {
            await filmSizesApi.delete(sizeObj.id);
            setFilmSizes(filmSizes.filter(f => f.id !== sizeObj.id));
        } catch (err) {
            toast.error('Failed to delete film size');
        }
    };

    const stats = [
        {
            title: 'Total Assigned',
            value: statsData.totalOrders,
            description: 'All orders assigned to you',
            icon: Package,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
        },
        {
            title: 'Submitted',
            value: statsData.completedOrders,
            description: 'Sheets sent back to company',
            icon: TrendingUp,
            color: 'text-emerald-600',
            bgColor: 'bg-emerald-50',
        },
        {
            title: 'Accepted',
            value: statsData.inProgress,
            description: 'In progress orders',
            icon: Clock,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50',
        },
        {
            title: 'Pending Action',
            value: statsData.pendingOrders,
            description: 'Awaiting your response',
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

            {/* Settings Row */}
            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader className="bg-slate-50 border-b pb-4">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-blue-100 rounded-md text-blue-700">
                                <Film className="h-5 w-5" />
                            </div>
                            <div>
                                <CardTitle className="text-lg">Manage Film Sizes</CardTitle>
                                <CardDescription>Add file/film sizes to use as quick suggestions</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                        <form onSubmit={handleAddFilmSize} className="flex items-center gap-2">
                            <Input
                                placeholder="Enter size (e.g. 4x4, 8x10)"
                                value={newFilmSize}
                                onChange={(e) => setNewFilmSize(e.target.value)}
                            />
                            <Button type="submit" className="gap-2 bg-blue-600 hover:bg-blue-700 font-medium whitespace-nowrap">
                                <PlusCircle className="h-4 w-4" />
                                Add Size
                            </Button>
                        </form>
                        
                        <div className="border rounded-md divide-y overflow-hidden">
                            {filmSizes.length === 0 ? (
                                <div className="p-4 text-center text-sm text-slate-500 bg-slate-50 italic">
                                    No film sizes added yet. Add one above.
                                </div>
                            ) : (
                                filmSizes.map((sizeObj) => (
                                    <div key={sizeObj.id} className="flex items-center justify-between p-3 bg-white hover:bg-slate-50 transition-colors">
                                        <div className="flex items-center gap-2">
                                            <Film className="h-4 w-4 text-slate-400" />
                                            <span className="font-medium text-slate-700">{sizeObj.size}</span>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleRemoveFilmSize(sizeObj)}
                                            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Placeholder for future detailed orders list component */}
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Assigned Orders</CardTitle>
                        <CardDescription>Your most recent job assignments from companies</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {statsData.recentOrders.length === 0 ? (
                            <div className="py-12 text-center text-slate-500 bg-slate-50 rounded border border-dashed">
                                <Package className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                                <p>No orders assigned to you yet.</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {statsData.recentOrders.map((order) => (
                                    <div key={order.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                                        <div>
                                            <p className="font-medium text-slate-800 text-sm">
                                                {order.job_no || '—'}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                RS: {order.rs_no || '—'} • {order.company_name || 'Unknown'}
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
        </div>
    );
}
