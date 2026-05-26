import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Factory, 
  Building2, 
  Truck, 
  ShieldAlert, 
  Lock, 
  Eye, 
  EyeOff, 
  Loader2, 
  ArrowRight,
  Activity,
  Users,
  CheckCircle,
  Mail
} from 'lucide-react';
import { toast } from 'sonner';

export default function HomePage() {
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState('company');
  const [orgCode, setOrgCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // If already logged in, redirect to correct dashboard
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.portalType === 'company') {
        navigate('/company/dashboard', { replace: true });
      } else if (user.portalType === 'vendor') {
        navigate('/vendor/dashboard', { replace: true });
      } else if (user.portalType === 'superadmin') {
        navigate('/superadmin/dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  // Pre-select tab from query params if available (e.g. /?portal=vendor)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search || location.search);
    const portalParam = params.get('portal');
    if (portalParam && ['company', 'vendor', 'superadmin'].includes(portalParam)) {
      setActiveTab(portalParam);
    }
  }, [location]);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const success = await login(email, password, activeTab, activeTab === 'company' ? orgCode : null);

      if (success) {
        toast.success(`Welcome back! Successfully authenticated.`);
        if (activeTab === 'company') {
          navigate('/company/dashboard');
        } else if (activeTab === 'vendor') {
          navigate('/vendor/dashboard');
        } else if (activeTab === 'superadmin') {
          navigate('/superadmin/dashboard');
        }
      } else {
        toast.error('Invalid credentials. Please verify and try again.');
      }
    } catch (err) {
      toast.error(err.message || 'Login failed. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFillDemo = (portalType, demoEmail, demoPass, demoOrg = '') => {
    setActiveTab(portalType);
    setEmail(demoEmail);
    setPassword(demoPass);
    if (portalType === 'company') {
      setOrgCode(demoOrg);
    } else {
      setOrgCode('');
    }
    toast.success(`${portalType.charAt(0).toUpperCase() + portalType.slice(1)} demo credentials pre-filled!`);
  };

  const getThemeColors = () => {
    if (activeTab === 'company') {
      return {
        glow: 'from-blue-500/20 via-indigo-500/10 to-transparent',
        glowBg: 'bg-blue-500/20',
        textGradient: 'from-blue-200 to-indigo-400',
        button: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-500/20 focus:ring-blue-500/50',
        activeBorder: 'border-blue-500/30',
        iconColor: 'text-blue-400',
        iconBg: 'bg-blue-500/10 border-blue-500/20',
      };
    }
    if (activeTab === 'vendor') {
      return {
        glow: 'from-emerald-500/20 via-teal-500/10 to-transparent',
        glowBg: 'bg-emerald-500/20',
        textGradient: 'from-emerald-200 to-teal-400',
        button: 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-500/20 focus:ring-emerald-500/50',
        activeBorder: 'border-emerald-500/30',
        iconColor: 'text-emerald-400',
        iconBg: 'bg-emerald-500/10 border-emerald-500/20',
      };
    }
    return {
      glow: 'from-purple-500/20 via-pink-500/10 to-transparent',
      glowBg: 'bg-purple-500/20',
      textGradient: 'from-purple-200 to-pink-400',
      button: 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-purple-500/20 focus:ring-purple-500/50',
      activeBorder: 'border-purple-500/30',
      iconColor: 'text-purple-400',
      iconBg: 'bg-purple-500/10 border-purple-500/20',
    };
  };

  const theme = getThemeColors();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-hidden font-sans selection:bg-blue-600 selection:text-white">
      {/* Background Ambience & Dotted Grid Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900/60 via-slate-950 to-slate-950 pointer-events-none z-0" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none z-0" />
      
      {/* Interactive color-shifting glow blob */}
      <div className={`absolute top-[10%] right-[10%] w-[35rem] h-[35rem] rounded-full filter blur-[150px] opacity-30 mix-blend-screen animate-pulse duration-[8000ms] pointer-events-none z-0 transition-all duration-1000 ${theme.glowBg}`} />
      
      {/* Header */}
      <header className="border-b border-white/5 bg-slate-950/40 backdrop-blur-md relative z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="p-2.5 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/20 transition-transform duration-300 group-hover:scale-105">
              <Factory className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                Crystal Industries
              </h1>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Industrial Films Manufacturing</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
              Systems Operational
            </span>
          </div>
        </div>
      </header>

      {/* Main Grid Workspace */}
      <main className="max-w-7xl mx-auto w-full px-6 py-12 md:py-16 grid lg:grid-cols-12 gap-12 items-center relative z-10 flex-1">
        {/* Left Info Panel */}
        <div className="lg:col-span-5 space-y-8 lg:pr-6 text-center lg:text-left">
          <div className="space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 border border-blue-500/20 text-blue-400">
              Production V2.4 Active
            </span>
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-none">
              Streamlining <br />
              <span className={`bg-gradient-to-r bg-clip-text text-transparent transition-all duration-1000 ${theme.textGradient}`}>
                Manufacturing
              </span> <br />
              Workflows.
            </h2>
            <p className="text-slate-400 text-md max-w-lg leading-relaxed mx-auto lg:mx-0">
              Unified operating portal for Crystal Industries staff and external manufacturing vendors. Coordinate tasks, check film metrics, and sync observations in real time.
            </p>
          </div>


          {/* Features Ticker */}
          <div className="space-y-3 hidden sm:block">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <Activity className="h-5 w-5 text-indigo-400 shrink-0" />
              <div className="text-left">
                <p className="text-xs font-semibold text-white">Real-time Progress Tracker</p>
                <p className="text-[11px] text-slate-400">Track and review observation columns instantly</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <Users className="h-5 w-5 text-emerald-400 shrink-0" />
              <div className="text-left">
                <p className="text-xs font-semibold text-white">Collaborative Vendor Ecosystem</p>
                <p className="text-[11px] text-slate-400">Reassign pending rows or revoke assignments dynamically</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Glassmorphic Login Card */}
        <div className="lg:col-span-7 flex justify-center w-full">
          <div className="w-full max-w-lg relative">
            {/* Soft decorative glow background behind card */}
            <div className={`absolute -inset-1 rounded-3xl bg-gradient-to-r blur-xl opacity-30 transition-all duration-1000 z-0 ${theme.glow}`} />

            <Card className={`border bg-slate-900/60 backdrop-blur-xl shadow-2xl relative z-10 rounded-3xl transition-all duration-1000 ${theme.activeBorder}`}>
              <CardHeader className="space-y-2 pb-6 pt-8 px-8 text-center">
                <div className="flex justify-center mb-1">
                  <div className={`p-4 rounded-2xl border transition-all duration-1000 ${theme.iconBg}`}>
                    {activeTab === 'company' && <Building2 className={`h-8 w-8 transition-colors ${theme.iconColor}`} />}
                    {activeTab === 'vendor' && <Truck className={`h-8 w-8 transition-colors ${theme.iconColor}`} />}
                    {activeTab === 'superadmin' && <ShieldAlert className={`h-8 w-8 transition-colors ${theme.iconColor}`} />}
                  </div>
                </div>
                <CardTitle className="text-3xl font-extrabold tracking-tight text-white">
                  {activeTab === 'company' && 'Company Portal'}
                  {activeTab === 'vendor' && 'Vendor Hub'}
                  {activeTab === 'superadmin' && 'Secure Admin'}
                </CardTitle>
                <CardDescription className="text-slate-400 text-sm">
                  {activeTab === 'company' && 'Authorized personnel sign-in to review sheets & assign work.'}
                  {activeTab === 'vendor' && 'Partners portal to accept work orders and submit film observations.'}
                  {activeTab === 'superadmin' && 'Super administrator terminal to manage platform organizations.'}
                </CardDescription>
              </CardHeader>

              <CardContent className="px-8 pb-8">
                {/* Modern Sliding Segmented Tabs */}
                <div className="grid grid-cols-3 gap-1 bg-slate-950/60 p-1.5 rounded-2xl border border-white/5 mb-6">
                  <button
                    type="button"
                    onClick={() => { setActiveTab('company'); setEmail(''); setPassword(''); setOrgCode(''); }}
                    className={`py-2.5 text-xs font-bold rounded-xl transition-all duration-300 flex flex-col items-center gap-1 border-0 outline-none ${
                      activeTab === 'company' 
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Building2 className="h-4 w-4" />
                    <span>Company</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setActiveTab('vendor'); setEmail(''); setPassword(''); setOrgCode(''); }}
                    className={`py-2.5 text-xs font-bold rounded-xl transition-all duration-300 flex flex-col items-center gap-1 border-0 outline-none ${
                      activeTab === 'vendor' 
                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' 
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Truck className="h-4 w-4" />
                    <span>Vendor</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setActiveTab('superadmin'); setEmail(''); setPassword(''); setOrgCode(''); }}
                    className={`py-2.5 text-xs font-bold rounded-xl transition-all duration-300 flex flex-col items-center gap-1 border-0 outline-none ${
                      activeTab === 'superadmin' 
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' 
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <ShieldAlert className="h-4 w-4" />
                    <span>Admin</span>
                  </button>
                </div>

                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  {/* Org Code Field - only for Company Tab */}
                  {activeTab === 'company' && (
                    <div className="space-y-1.5 transition-all duration-500 animate-in fade-in slide-in-from-top-2">
                      <Label htmlFor="orgCode" className="text-xs font-bold text-slate-300 uppercase tracking-wide">
                        Organization Code
                      </Label>
                      <Input
                        id="orgCode"
                        type="text"
                        placeholder="e.g. CRYSTAL"
                        value={orgCode}
                        onChange={(e) => setOrgCode(e.target.value)}
                        required
                        className="bg-slate-950/60 border-white/10 hover:border-white/20 focus:border-blue-500 text-white placeholder:text-slate-600 uppercase h-11 rounded-xl transition-all duration-200"
                      />
                    </div>
                  )}

                  {/* ID / Email Field */}
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-xs font-bold text-slate-300 uppercase tracking-wide">
                      {activeTab === 'company' && 'User ID'}
                      {activeTab === 'vendor' && 'Login ID or Email'}
                      {activeTab === 'superadmin' && 'Admin Email'}
                    </Label>
                    <div className="relative">
                      <Input
                        id="email"
                        type="text"
                        placeholder={
                          activeTab === 'company' 
                            ? 'Enter company ID' 
                            : activeTab === 'vendor' 
                              ? 'Enter vendor login ID' 
                              : 'Enter admin email'
                        }
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="bg-slate-950/60 border-white/10 hover:border-white/20 focus:border-slate-500 text-white placeholder:text-slate-600 h-11 rounded-xl pr-10 transition-all duration-200"
                      />
                      <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                        <Mail className="h-4 w-4" />
                      </div>
                    </div>
                  </div>

                  {/* Password Field */}
                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-xs font-bold text-slate-300 uppercase tracking-wide">
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="bg-slate-950/60 border-white/10 hover:border-white/20 focus:border-slate-500 text-white placeholder:text-slate-600 h-11 rounded-xl pr-10 transition-all duration-200"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <Button 
                    type="submit" 
                    className={`w-full text-sm font-bold text-white h-11 rounded-xl shadow-lg border-0 cursor-pointer mt-6 flex items-center justify-center gap-2 active:scale-[0.98] transition-all duration-300 ${theme.button}`}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4.5 w-4.5 animate-spin" />
                        <span>Authenticating...</span>
                      </>
                    ) : (
                      <>
                        <span>Sign In</span>
                        <ArrowRight className="h-4.5 w-4.5" />
                      </>
                    )}
                  </Button>
                </form>

                {/* Quick Auto-fill Demo Credentials */}
                <div className="mt-8 pt-6 border-t border-white/5 space-y-3">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">
                    Quick Access Demo Accounts
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    <button
                      type="button"
                      onClick={() => handleFillDemo('company', 'admin', 'admin', 'CRYSTAL')}
                      className="text-[11px] font-semibold px-3 py-1.5 rounded-xl bg-blue-500/5 hover:bg-blue-500/10 border border-blue-500/10 hover:border-blue-500/20 text-blue-300 hover:text-blue-200 transition-all duration-200 cursor-pointer"
                    >
                      Company Staff
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFillDemo('vendor', 'vendor@filmworks.com', 'vendor123')}
                      className="text-[11px] font-semibold px-3 py-1.5 rounded-xl bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/10 hover:border-emerald-500/20 text-emerald-300 hover:text-emerald-200 transition-all duration-200 cursor-pointer"
                    >
                      Vendor Partner
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFillDemo('superadmin', 'superadmin', 'admin')}
                      className="text-[11px] font-semibold px-3 py-1.5 rounded-xl bg-purple-500/5 hover:bg-purple-500/10 border border-purple-500/10 hover:border-purple-500/20 text-purple-300 hover:text-purple-200 transition-all duration-200 cursor-pointer"
                    >
                      Super Admin
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-6 bg-slate-950/20 relative z-10">
        <div className="max-w-7xl mx-auto px-6 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 Crystal Industries. All rights reserved.</p>
          <p className="font-medium text-slate-400">Enterprise Work-Order Management Platform</p>
        </div>
      </footer>
    </div>
  );
}
