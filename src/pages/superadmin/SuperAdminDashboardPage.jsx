import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Building2, Users, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function SuperAdminDashboardPage() {
  const [totalOrgs, setTotalOrgs] = useState(0);
  const [totalVendors, setTotalVendors] = useState(0);

  useEffect(() => {
    // Collect stats
    try {
      const companies = JSON.parse(localStorage.getItem('crystal_companies') || '[]');
      setTotalOrgs(companies.length);
    } catch {
      setTotalOrgs(0);
    }

    try {
      const vendors = JSON.parse(localStorage.getItem('crystal_vendors') || '[]');
      setTotalVendors(vendors.length);
    } catch {
      setTotalVendors(0);
    }
  }, []);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">System Initialization Complete</h1>
        <p className="text-slate-500 mt-1">Master dashboard for tracking global tenants and network performance.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Organizations Card */}
        <Card className="border-purple-200 bg-white shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold text-purple-900">Organizations</CardTitle>
                <CardDescription>Number of active tenants</CardDescription>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mt-2 text-4xl font-bold text-slate-900">{totalOrgs}</div>
            <div className="mt-4 pt-4 border-t border-slate-100">
              <Button asChild variant="ghost" className="w-full justify-between items-center text-purple-700 hover:text-purple-800 hover:bg-purple-50">
                <Link to="/superadmin/organizations">
                  Manage Organizations <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Vendors Card */}
        <Card className="border-indigo-200 bg-white shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold text-indigo-900">Vendors</CardTitle>
                <CardDescription>Global vendor marketplace users</CardDescription>
              </div>
              <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
                <Users className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mt-2 text-4xl font-bold text-slate-900">{totalVendors}</div>
            <div className="mt-4 pt-4 border-t border-slate-100">
              <Button asChild variant="ghost" className="w-full justify-between items-center text-indigo-700 hover:text-indigo-800 hover:bg-indigo-50">
                <Link to="/superadmin/vendors">
                  Manage Vendors <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
