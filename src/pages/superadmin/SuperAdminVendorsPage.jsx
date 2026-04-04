import { Users, Search, FileText, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function SuperAdminVendorsPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [vendors, setVendors] = useState(() => {
        try {
            const saved = localStorage.getItem('crystal_vendors');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });
    const [searchQuery, setSearchQuery] = useState('');

    const [selectedVendor, setSelectedVendor] = useState(null);
    const [loginData, setLoginData] = useState({
        loginId: '',
        password: ''
    });

    useEffect(() => {
        localStorage.setItem('crystal_vendors', JSON.stringify(vendors));
    }, [vendors]);

    const [formData, setFormData] = useState({
        vendorNo: '',
        vendorName: '',
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await new Promise((resolve) => setTimeout(resolve, 500));

            const newVendor = {
                id: Date.now().toString(),
                vendorNo: formData.vendorNo,
                vendorName: formData.vendorName,
                createdAt: new Date().toISOString(),
            };

            setVendors((prev) => [newVendor, ...prev]);
            toast.success('Vendor added to global marketplace successfully!');

            setFormData({ vendorNo: '', vendorName: '' });
        } catch {
            toast.error('Failed to create vendor');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const filteredVendors = vendors.filter(vendor =>
        vendor.vendorNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vendor.vendorName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const openLoginModal = (vendor) => {
        setSelectedVendor(vendor);
        setLoginData({
            loginId: vendor.loginId || '',
            password: vendor.password || ''
        });
    };

    const handleSaveCredentials = (e) => {
        e.preventDefault();

        const updatedVendors = vendors.map(v => {
            if (v.id === selectedVendor.id) {
                return { ...v, loginId: loginData.loginId, password: loginData.password };
            }
            return v;
        });

        setVendors(updatedVendors);
        toast.success(`Credentials saved for ${selectedVendor.vendorName}`);
        setSelectedVendor(null);
    };

    const handleDeleteVendor = (e, id) => {
        e.stopPropagation();
        if (!window.confirm('Are you sure you want to revoke this vendor? They will lose marketplace access.')) return;
        setVendors(prev => prev.filter(vendor => vendor.id !== id));
        toast.success('Vendor revoked from marketplace successfully!');
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-12">
            {/* Header */}
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <Users className="h-6 w-6 text-indigo-700" />
                    <h1 className="text-2xl font-bold text-slate-900">Global Vendor Network</h1>
                </div>
                <p className="text-slate-500">Manage all vendors operating across all organizations in the platform.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Create Form */}
                <div className="lg:col-span-1">
                    <form onSubmit={handleSubmit}>
                        <Card className="border-indigo-100">
                            <CardHeader>
                                <CardTitle className="text-indigo-900">Onboard Market Vendor</CardTitle>
                                <CardDescription>Enter vendor profile details</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="vendorNo">Vendor Tag Number *</Label>
                                    <Input
                                        id="vendorNo"
                                        placeholder="e.g., GLOBAL-2026-V1"
                                        value={formData.vendorNo}
                                        onChange={(e) => handleChange('vendorNo', e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="vendorName">Vendor Official Name *</Label>
                                    <Input
                                        id="vendorName"
                                        placeholder="e.g., Global Industrial Diagnostics"
                                        value={formData.vendorName}
                                        onChange={(e) => handleChange('vendorName', e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="pt-2">
                                    <Button
                                        type="submit"
                                        className="bg-indigo-600 hover:bg-indigo-700 w-full"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? 'Onboarding...' : 'Onboard onto Network'}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </form>
                </div>

                {/* Right Column: Vendors List */}
                <div className="lg:col-span-2 space-y-4">
                    <Card>
                        <CardHeader className="pb-3 border-b border-slate-100">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div>
                                    <CardTitle>Market Network Roster</CardTitle>
                                    <CardDescription>View, secure, and manage global marketplace resources</CardDescription>
                                </div>
                                <div className="relative w-full sm:w-64">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                                    <Input
                                        type="search"
                                        placeholder="Search network..."
                                        className="pl-9"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-4">
                            {vendors.length === 0 ? (
                                <div className="text-center py-12 text-slate-500">
                                    <FileText className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                                    <p>No globally enrolled vendors.</p>
                                    <p className="text-sm">Onboard a vendor to share them across organizations.</p>
                                </div>
                            ) : filteredVendors.length === 0 ? (
                                <div className="text-center py-8 text-slate-500">
                                    <p>No vendors match your search "{searchQuery}"</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {filteredVendors.map((vendor) => (
                                        <div
                                            key={vendor.id}
                                            onClick={() => openLoginModal(vendor)}
                                            className="flex items-center justify-between p-4 rounded-lg border bg-white hover:border-indigo-400 cursor-pointer transition-colors"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                                                    <Users className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900 tracking-tight">{vendor.vendorName}</p>
                                                    <p className="text-xs text-slate-500 mt-0.5 font-mono">Tag: {vendor.vendorNo}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right text-sm text-slate-500 hidden sm:block">
                                                    {vendor.loginId ? (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                            Login Provisioned
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                                            Pending Access
                                                        </span>
                                                    )}
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-red-400 hover:text-red-700 hover:bg-red-50 h-8 w-8"
                                                    onClick={(e) => handleDeleteVendor(e, vendor.id)}
                                                    title="Revoke Vendor Authorization"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Login Credentials Modal */}
            <Dialog open={!!selectedVendor} onOpenChange={(open) => !open && setSelectedVendor(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-indigo-900">Provision Market Access</DialogTitle>
                        <DialogDescription>
                            Assign systemic login credentials for {selectedVendor?.vendorName} to directly access the global portal.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSaveCredentials} className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label htmlFor="loginId">Assigned Vendor ID</Label>
                            <Input
                                id="loginId"
                                value={loginData.loginId}
                                onChange={(e) => setLoginData(prev => ({ ...prev, loginId: e.target.value }))}
                                placeholder="e.g., global_vendor_01"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Assigned Security Passkey</Label>
                            <Input
                                id="password"
                                type="text"
                                value={loginData.password}
                                onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                                placeholder="Enter secure key"
                                required
                            />
                        </div>
                        <div className="flex justify-end gap-3 pt-4">
                            <Button type="button" variant="outline" onClick={() => setSelectedVendor(null)}>
                                Cancel Identity
                            </Button>
                            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                                Provision Network Access
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
