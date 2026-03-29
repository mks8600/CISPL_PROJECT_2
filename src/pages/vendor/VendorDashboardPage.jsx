import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Package, TrendingUp, Clock, AlertCircle, Film, Trash2, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const ASSIGNED_KEY = 'crystal_assigned_sheets';

function getMyAssignments(vendorId) {
    try {
        const saved = localStorage.getItem(ASSIGNED_KEY);
        const all = saved ? JSON.parse(saved) : [];
        // Exclude reassigned child assignments to prevent duplicate counting
        return all.filter((a) => a.vendorNo === vendorId && !a.reassignedFrom);
    } catch {
        return [];
    }
}

export default function VendorDashboardPage() {
    const { user } = useAuth();
    const [myOrders, setMyOrders] = useState([]);

    const [filmSizes, setFilmSizes] = useState([]);
    const [newFilmSize, setNewFilmSize] = useState('');

    useEffect(() => {
        if (!user) return;
        const load = () => {
            setMyOrders(getMyAssignments(user.vendorId));
            try {
                const savedSizes = localStorage.getItem(`crystal_film_sizes_${user.vendorId}`);
                if (savedSizes) setFilmSizes(JSON.parse(savedSizes));
            } catch {}
        };
        load();
        window.addEventListener('focus', load);
        return () => window.removeEventListener('focus', load);
    }, [user]);

    const handleAddFilmSize = (e) => {
        e.preventDefault();
        const trimmed = newFilmSize.trim();
        if (!trimmed) return;
        if (filmSizes.some(f => f.toLowerCase() === trimmed.toLowerCase())) return;
        const updated = [...filmSizes, trimmed];
        setFilmSizes(updated);
        localStorage.setItem(`crystal_film_sizes_${user.vendorId}`, JSON.stringify(updated));
        setNewFilmSize('');
    };

    const handleRemoveFilmSize = (size) => {
        const updated = filmSizes.filter(f => f !== size);
        setFilmSizes(updated);
        localStorage.setItem(`crystal_film_sizes_${user.vendorId}`, JSON.stringify(updated));
    };

    const pendingCount = myOrders.filter((a) => a.status === 'pending').length;
    const acceptedCount = myOrders.filter((a) => a.status === 'accepted').length;
    const submittedCount = myOrders.filter((a) => a.submitted).length;
    const totalCount = myOrders.length;

    const stats = [
        {
            title: 'Total Assigned',
            value: totalCount,
            description: 'All orders assigned to you',
            icon: Package,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
        },
        {
            title: 'Submitted',
            value: submittedCount,
            description: 'Sheets sent back to company',
            icon: TrendingUp,
            color: 'text-emerald-600',
            bgColor: 'bg-emerald-50',
        },
        {
            title: 'Accepted',
            value: acceptedCount,
            description: 'In progress orders',
            icon: Clock,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50',
        },
        {
            title: 'Pending Action',
            value: pendingCount,
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
                                filmSizes.map((size) => (
                                    <div key={size} className="flex items-center justify-between p-3 bg-white hover:bg-slate-50 transition-colors">
                                        <div className="flex items-center gap-2">
                                            <Film className="h-4 w-4 text-slate-400" />
                                            <span className="font-medium text-slate-700">{size}</span>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleRemoveFilmSize(size)}
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
                        <CardDescription>View your most recent job assignments from the company</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="py-12 text-center text-slate-500 bg-slate-50 rounded border border-dashed">
                            <p>Order tracking capabilities coming soon to the Vendor Portal.</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
