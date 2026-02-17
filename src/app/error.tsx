'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
          <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        
        <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
          Something went wrong
        </h2>
        
        <p className="text-gray-600 text-center mb-6">
          We encountered an unexpected error. This has been logged and our team will investigate.
        </p>

        {process.env.NODE_ENV === 'development' && error.message && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded text-sm">
            <p className="font-semibold text-red-900 mb-1">Error Details:</p>
            <p className="text-red-700 font-mono text-xs break-all">{error.message}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={reset}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Try Again
          </button>
          <a
            href="/dashboard"
            className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium text-center"
          >
            Go Home
          </a>
        </div>

        {error.digest && (
          <p className="mt-4 text-xs text-gray-500 text-center">
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
