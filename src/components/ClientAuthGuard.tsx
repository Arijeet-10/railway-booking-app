"use client";

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

interface ClientAuthGuardProps {
  children: ReactNode;
  redirectTo?: string; // Optional: redirect to a specific page other than /login
}

const ClientAuthGuard = ({ children, redirectTo = '/login' }: ClientAuthGuardProps) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace(redirectTo);
    }
  }, [user, loading, router, redirectTo]);

  if (loading || !user) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
};

export default ClientAuthGuard;
