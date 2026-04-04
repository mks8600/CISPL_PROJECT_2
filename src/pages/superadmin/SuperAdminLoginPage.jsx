import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';
import { toast } from 'sonner';

export default function SuperAdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  // Cross-portal protection
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.portalType === 'superadmin') navigate('/superadmin/dashboard', { replace: true });
      else if (user.portalType === 'company') navigate('/company/dashboard', { replace: true });
      else if (user.portalType === 'vendor') navigate('/vendor/dashboard', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const success = await login(email, password, 'superadmin');

    if (success) {
      toast.success('Login successful!');
      navigate('/superadmin/dashboard');
    } else {
      toast.error('Invalid super admin credentials. Access denied.', {
        style: { background: '#fef2f2', color: '#991b1b', border: '1px solid #f87171' },
      });
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-900 p-4 relative overflow-hidden">
      
      {/* Back button */}
      <Button 
        variant="ghost" 
        asChild 
        className="absolute top-6 left-6 text-purple-200 hover:text-white hover:bg-white/10"
      >
        <Link to="/">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Link>
      </Button>

      {/* Login Card */}
      <div className="w-full max-w-md mx-auto relative z-10 w-full max-w-md">
        <Card className="border-purple-500/30 bg-black/40 backdrop-blur-xl shadow-2xl overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-purple-500 to-pink-500 w-full" />
          
          <CardHeader className="space-y-3 pb-6 pt-8 px-8 text-center pt-8">
            <div className="mx-auto w-16 h-16 bg-purple-500/20 rounded-2xl flex items-center justify-center border border-purple-500/30 mb-2">
              <ShieldAlert className="h-8 w-8 text-purple-400" />
            </div>
            <CardTitle className="text-3xl font-bold tracking-tight text-white">Super Admin Access</CardTitle>
            <CardDescription className="text-purple-200 text-sm">
              Restricted area. Please sign in with your master credentials.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="px-8 pb-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-purple-200 font-medium tracking-wide text-xs uppercase">Admin ID</Label>
                <Input
                  id="email"
                  type="text"
                  placeholder="e.g. admin"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                  className="bg-white/5 border-purple-500/30 text-white placeholder:text-purple-300/50 focus:border-purple-400 focus:ring-purple-400 h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-purple-200 font-medium tracking-wide text-xs uppercase">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                  className="bg-white/5 border-purple-500/30 text-white placeholder:text-purple-300/50 focus:border-purple-400 focus:ring-purple-400 h-12"
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 h-12 text-md shadow-lg shadow-purple-900/50 mt-4 transition-all duration-300 border-0"
                disabled={isLoading}
              >
                {isLoading ? 'Authenticating...' : 'Secure Login'}
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-purple-500/20">
              <p className="text-xs text-purple-300/60 text-center font-mono">
                [SYS_ACCESS]: superadmin / admin
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
