import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Factory, Building2, Truck, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Factory className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Crystal Industries</h1>
              <p className="text-xs text-blue-200">Industrial Films Manufacturing</p>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-6 py-16">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Manufacturing Portal
          </h2>
          <p className="text-lg text-blue-200 max-w-2xl mx-auto">
            Streamline your industrial film manufacturing workflow. Create work orders, 
            track progress, and manage deliverables all in one place.
          </p>
        </div>

        {/* Portal Selection Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Company Portal Card */}
          <Card className="bg-white/10 backdrop-blur border-white/20 hover:bg-white/15 transition-colors">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
                <Building2 className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-2xl text-white">Company Portal</CardTitle>
              <CardDescription className="text-blue-200">
                For Crystal Industries Staff
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm text-blue-100">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                  Create and manage work orders
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                  Track order progress in real-time
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                  View vendor deliverables
                </li>
              </ul>
              <Button asChild className="w-full bg-blue-600 hover:bg-blue-700">
                <Link to="/company/login" className="flex items-center justify-center gap-2">
                  Company Login
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Vendor Portal Card */}
          <Card className="bg-white/10 backdrop-blur border-white/20 hover:bg-white/15 transition-colors">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-emerald-600 rounded-full flex items-center justify-center mb-4">
                <Truck className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-2xl text-white">Vendor Portal</CardTitle>
              <CardDescription className="text-emerald-200">
                For Third-Party Partners
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm text-emerald-100">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                  View assigned work orders
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                  Update order status
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                  Upload deliverables
                </li>
              </ul>
              <Button asChild className="w-full bg-emerald-600 hover:bg-emerald-700">
                <Link to="/vendor/login" className="flex items-center justify-center gap-2">
                  Vendor Login
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Demo Credentials */}
        <div className="mt-16 max-w-2xl mx-auto">
          <Card className="bg-white/5 backdrop-blur border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-200">Demo Credentials</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium text-white mb-1">Company Portal:</p>
                <p className="text-blue-200">admin@crystalindustries.com</p>
                <p className="text-blue-300">Password: demo123</p>
              </div>
              <div>
                <p className="font-medium text-white mb-1">Vendor Portal:</p>
                <p className="text-emerald-200">vendor@filmworks.com</p>
                <p className="text-emerald-300">Password: vendor123</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-6">
        <div className="container mx-auto px-6 text-center text-sm text-blue-300">
          <p>Crystal Industries - Industrial Films Manufacturing</p>
          <p className="text-blue-400 mt-1">Demo Application</p>
        </div>
      </footer>
    </div>
  );
}
