'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  let errorMessage = 'An error occurred during authentication.';

  if (error === 'OAuthSignin')
    errorMessage =
      'There was a problem with the sign in process. Please try again.';
  if (error === 'OAuthCallback')
    errorMessage =
      'There was a problem with the authentication callback. Please try again.';
  if (error === 'OAuthCreateAccount')
    errorMessage =
      'There was a problem creating your account. Please try again.';
  if (error === 'EmailCreateAccount')
    errorMessage =
      'There was a problem creating your account. Please try again.';
  if (error === 'Callback')
    errorMessage =
      'There was a problem with the authentication callback. Please try again.';
  if (error === 'EmailSignin')
    errorMessage =
      'There was a problem sending the email. Please try again.';
  if (error === 'CredentialsSignin')
    errorMessage =
      'The credentials you provided are invalid. Please try again.';
  if (error === 'SessionRequired')
    errorMessage = 'You must be signed in to access this page.';
  if (error === 'Configuration')
    errorMessage =
      'There is a problem with the server configuration. Please contact support.';
  if (error === 'AccessDenied')
    errorMessage = 'You do not have permission to sign in.';
  if (error === 'Verification')
    errorMessage =
      'The sign in link has expired or has already been used.';

  return (
    <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Authentication Error</h1>

        <div className="bg-red-50 rounded-lg p-6 mb-6">
          <p className="text-red-800 mb-4">{errorMessage}</p>
        </div>

        <div className="mt-6">
          <Link
            href="/signin"
            className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AuthError() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-blue-100 px-4">
      <Suspense
        fallback={
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-4">Loading...</h1>
            </div>
          </div>
        }
      >
        <AuthErrorContent />
      </Suspense>
    </div>
  );
}
