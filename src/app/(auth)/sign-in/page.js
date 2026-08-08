import React, { Suspense } from 'react';
import Login from '@/features/auth/components/Login';

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-white"><div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>}>
      <Login />
    </Suspense>
  );
}