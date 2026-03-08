import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Package, Lock, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

export default function VendorLoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const success = await login(email, password, 'vendor');

            if (success) {
                toast.success('Successfully logged in');
                navigate('/vendor/dashboard');
            } else {
                toast.error('Invalid email or password');
            }
        } catch {
            toast.error('An error occurred during login');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
            <div className="w-full max-w-md space-y-8">
                <div className="flex flex-col items-center justify-center text-center">
                    <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-600 text-white shadow-lg mb-6">
                        <Package className="w-8 h-8" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                        Vendor Portal
                    </h1>
                    <p className="text-slate-500 mt-2">
                        Sign in to access your dashboard
                    </p>
                </div>

                <Card className="border-slate-200/60 shadow-xl bg-white/50 backdrop-blur-xl">
                    <form onSubmit={handleLogin}>
                        <CardHeader className="space-y-1 pb-4">
                            <CardTitle className="text-xl">Authentication</CardTitle>
                            <CardDescription>
                                Enter your vendor credentials assigned by the company
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Login ID or Email</Label>
                                <div className="relative">
                                    <Input
                                        id="email"
                                        type="text"
                                        placeholder="Enter your login ID"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="bg-white"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password">Password</Label>
                                </div>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="pl-10 bg-white"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-5 w-5" />
                                        ) : (
                                            <Eye className="h-5 w-5" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button
                                type="submit"
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Signing in...' : 'Sign in to Vendor Portal'}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>

                {/* Info Box */}
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800 flex items-start gap-3">
                    <div className="mt-0.5">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
                    </div>
                    <div>
                        <p className="font-medium mb-1">Testing Vendor Portal</p>
                        <p className="text-blue-700/90 leading-relaxed">
                            If you have assigned a login to a vendor in the Manage Vendors page, you can use that. Otherwise, default credentials provided during dev are available.
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
}
