import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Factory, ArrowLeft, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

export default function CompanyLoginPage() {
  const [orgCode, setOrgCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  // Cross-portal protection: redirect if already logged in
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.portalType === 'company') navigate('/company/dashboard', { replace: true });
      else if (user.portalType === 'vendor') navigate('/vendor/dashboard', { replace: true });
      else if (user.portalType === 'superadmin') navigate('/superadmin/dashboard', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const success = await login(email, password, 'company', orgCode);

    if (success) {
      toast.success('Login successful!');
      navigate('/company/dashboard');
    } else {
      toast.error('Invalid email or password');
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-blue-200 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Portal Selection
        </Link>

        <Card className="bg-white/10 backdrop-blur border-white/20">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
              <Factory className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl text-white">Company Portal</CardTitle>
            <CardDescription className="text-blue-200">
              Sign in to manage work orders
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="orgCode" className="text-blue-100">Org Code</Label>
                <Input
                  id="orgCode"
                  type="text"
                  placeholder="e.g. CRYSTAL"
                  value={orgCode}
                  onChange={(e) => setOrgCode(e.target.value)}
                  required
                  className="bg-white/10 border-white/20 text-white placeholder:text-blue-300 uppercase"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-blue-100">User ID</Label>
                <Input
                  id="email"
                  type="text"
                  placeholder="admin"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-white/10 border-white/20 text-white placeholder:text-blue-300"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-blue-100">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-white/10 border-white/20 text-white placeholder:text-blue-300"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-white/10">
              <p className="text-xs text-blue-300 text-center flex flex-col gap-1">
                <span>Org Code: <strong>CRYSTAL</strong> | Demo User: <strong>admin</strong> | Pass: <strong>admin</strong></span>
                <span>Org Code: <strong>ACME</strong> | Demo User: <strong>acmeadmin</strong> | Pass: <strong>admin</strong></span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
