import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function CompanyLoginPage() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/?portal=company', { replace: true });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-slate-400 text-sm">Redirecting to login portal...</div>
    </div>
  );
}
