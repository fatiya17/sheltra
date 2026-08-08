import React, { Suspense } from 'react';
import Register from '@/features/auth/components/Register';

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-white"><div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>}>
      <Register />
    </Suspense>
  );
}