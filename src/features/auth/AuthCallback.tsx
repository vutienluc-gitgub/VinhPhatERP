import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { supabase } from '@/services/supabase/client';

export function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        navigate('/', { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="flex h-screen items-center justify-center flex-col gap-4 bg-[var(--bg-main,#f8fafc)]">
      <div className="w-10 h-10 border-[3px] border-[#e2e8f0] border-t-[#0f172a] rounded-full animate-spin" />
      <p className="text-[#64748b] text-sm">Đang hoàn tất đăng nhập...</p>
    </div>
  );
}
