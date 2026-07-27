"use client";
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

export default function LoginForm() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-8 border border-gray-100">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg">
              <span className="text-white text-2xl font-bold">G</span>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900 font-alegreya">
                Welcome to Gurukulam
              </h2>
              <p className="mt-2 text-gray-600 text-sm">
                Sign in with your Google Workspace account to access the portal
              </p>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800">
              {error === 'AccessDenied' && 'Access denied. Please use your school email address.'}
              {error === 'Configuration' && 'There is a configuration error. Please contact support.'}
              {!error && 'An error occurred during sign in. Please try again.'}
            </div>
          )}

          <div className="space-y-4">
            <Button
              onClick={() => signIn('google', { callbackUrl: '/admin' })}
              className="w-full h-12 text-base font-medium bg-white text-gray-900 border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 shadow-sm"
              size="lg"
            >
              <Globe className="w-5 h-5 mr-2" />
              Continue with Google
            </Button>

            <p className="text-xs text-center text-gray-500">
              By signing in, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <div className="flex items-center justify-center gap-6 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Secure
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Private
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Fast
              </span>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-gray-500 mt-6">
          Powered by Google Workspace • The Gurukulam School
        </p>
      </div>
    </div>
  );
}
