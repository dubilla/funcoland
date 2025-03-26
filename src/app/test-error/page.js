'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TestError() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to the error page with a specific error
    router.push('/auth/error?error=CredentialsSignin');
  }, [router]);
  
  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>Redirecting to error page...</p>
    </div>
  );
}