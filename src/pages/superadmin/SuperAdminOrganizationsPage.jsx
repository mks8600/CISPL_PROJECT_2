import { Building2, Search, FileText, Trash2 } from 'lucide-react';
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
import { companiesApi } from '@/lib/api/client';

export default function SuperAdminOrganizationsPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [organizations, setOrganizations] = useState([]);
    
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadOrganizations();
    }, []);

    const loadOrganizations = async () => {
        try {
            const data = await companiesApi.list();
            setOrganizations(data);
        } catch (err) {
            toast.error('Failed to load organizations');
        }
    };

    const [formData, setFormData] = useState({
        orgCode: '',
        name: '',
    });

    const [selectedOrg, setSelectedOrg] = useState(null);
    const [loginData, setLoginData] = useState({
        loginId: '',
        password: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const newOrg = await companiesApi.create({
                orgCode: formData.orgCode.toUpperCase(),
                name: formData.name,
            });

            setOrganizations((prev) => [newOrg, ...prev]);

            toast.success(`Organization ${formData.name} created!`, {
              description: `Tenant provisioned. Please click on it to assign admin credentials.`
            });

            setFormData({ orgCode: '', name: '' });
        } catch (err) {
            toast.error(err.message || 'Failed to create organization');
        } finally {
            setIsLoading(false);
        }
    };

    const openLoginModal = (org) => {
        setSelectedOrg(org);
        setLoginData({
            loginId: org.admin_login_id || '',
            password: ''
        });
    };

    const handleSaveCredentials = async (e) => {
        e.preventDefault();

        try {
            await companiesApi.setCredentials(selectedOrg.id, {
                email: loginData.loginId,
                password: loginData.password,
                name: 'Admin User',
            });

            // Update local state
            setOrganizations(prev => prev.map(o =>
                o.id === selectedOrg.id
                    ? { ...o, admin_login_id: loginData.loginId }
                    : o
            ));

            toast.success(`Admin credentials saved for ${selectedOrg.name}`);
            setSelectedOrg(null);
        } catch (err) {
            toast.error(err.message || 'Failed to save credentials');
        }
    };

    const handleChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleDeleteOrg = async (id) => {
        if (!window.confirm('Are you sure you want to delete this organization? All associated data will be lost.')) return;
        try {
            await companiesApi.delete(id);
            setOrganizations(prev => prev.filter(org => org.id !== id));
            toast.success('Organization deleted successfully!');
        } catch (err) {
            toast.error(err.message || 'Failed to delete organization');
        }
    };

    const filteredOrganizations = organizations.filter(org => {
        const code = org.org_code || org.orgCode || '';
        const name = org.name || '';
        return code.toLowerCase().includes(searchQuery.toLowerCase()) ||
            name.toLowerCase().includes(searchQuery.toLowerCase());
    });

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-12">
            {/* Header */}
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <Building2 className="h-6 w-6 text-purple-700" />
                    <h1 className="text-2xl font-bold text-slate-900">Manage Organizations</h1>
                </div>
                <p className="text-slate-500">Create, view, and assign new tenants to the platform.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Create Form */}
                <div className="lg:col-span-1">
                    <form onSubmit={handleSubmit}>
                        <Card className="border-purple-100">
                            <CardHeader>
                                <CardTitle className="text-purple-900">Add Organization</CardTitle>
                                <CardDescription>Provision a new multi-tenant environment</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="orgCode">Org Code *</Label>
                                    <Input
                                        id="orgCode"
                                        placeholder="e.g., TESLA"
                                        value={formData.orgCode}
                                        onChange={(e) => handleChange('orgCode', e.target.value)}
                                        required
                                        className="uppercase"
                                    />
                                    <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Must be unique, letters only recommended.</p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="name">Full Organization Name *</Label>
                                    <Input
                                        id="name"
                                        placeholder="e.g., Tesla Corporation"
                                        value={formData.name}
                                        onChange={(e) => handleChange('name', e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="pt-2">
                                    <Button
                                        type="submit"
                                        className="bg-purple-600 hover:bg-purple-700 w-full"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? 'Provisioning...' : 'Provision Tenant'}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </form>
                </div>

                {/* Right Column: Organizations List */}
                <div className="lg:col-span-2 space-y-4">
                    <Card>
                        <CardHeader className="pb-3 border-b border-slate-100">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div>
                                    <CardTitle>Active Tenants</CardTitle>
                                    <CardDescription>All organizations registered on the platform</CardDescription>
                                </div>
                                <div className="relative w-full sm:w-64">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                                    <Input
                                        type="search"
                                        placeholder="Search by name or code..."
                                        className="pl-9"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-4">
                            {organizations.length === 0 ? (
                                <div className="text-center py-12 text-slate-500">
                                    <FileText className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                                    <p>No organizations found.</p>
                                    <p className="text-sm">Provision a new tenant to see it listed here.</p>
                                </div>
                            ) : filteredOrganizations.length === 0 ? (
                                <div className="text-center py-8 text-slate-500">
                                    <p>No organizations match your search "{searchQuery}"</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {filteredOrganizations.map((org) => (
                                        <div
                                            key={org.id}
                                            onClick={() => openLoginModal(org)}
                                            className="flex items-center justify-between p-4 rounded-lg border bg-white hover:border-purple-400 cursor-pointer transition-colors"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
                                                    <Building2 className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-bold text-slate-900 tracking-tight">{org.name}</p>
                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-widest">{org.orgCode}</span>
                                                    </div>
                                                    <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1 font-mono">
                                                        <span>ID: {org.id}</span>
                                                        {org.createdAt && <span>• Created: {new Date(org.createdAt).toLocaleDateString()}</span>}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right text-sm text-slate-500 hidden sm:block">
                                                    {org.adminLoginId || org.admin_login_id ? (
                                                        <div className="flex flex-col items-end">
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                                {org.adminLoginId || org.admin_login_id}
                                                            </span>
                                                        </div>
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
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteOrg(org.id); }}
                                                    title="Delete Organization"
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
            <Dialog open={!!selectedOrg} onOpenChange={(open) => !open && setSelectedOrg(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-purple-900">Provision Master Administrator Identity</DialogTitle>
                        <DialogDescription>
                            Assign systemic login credentials for {selectedOrg?.name} to directly access the company portal.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSaveCredentials} className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label htmlFor="loginId">Admin Login ID/Email *</Label>
                            <Input
                                id="loginId"
                                value={loginData.loginId}
                                onChange={(e) => setLoginData(prev => ({ ...prev, loginId: e.target.value }))}
                                placeholder="e.g., admin@organization.com"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Initial Password *</Label>
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
                            <Button type="button" variant="outline" onClick={() => setSelectedOrg(null)}>
                                Cancel
                            </Button>
                            <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                                Provision Identity
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
