'use client'

import { useEffect } from 'react'
import { signOut } from 'next-auth/react'
import Link from 'next/link'

export default function SignOut() {
  useEffect(() => {
    // Automatically sign out when this page loads
    signOut({ redirect: false })
  }, [])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-blue-100 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">You've been signed out</h1>
        
        <div className="mb-6">
          <p className="text-gray-600">
            Your session has ended. Thanks for using FuncoLand!
          </p>
        </div>
        
        <div className="space-x-4">
          <Link
            href="/signin"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            Sign back in
          </Link>
          
          <Link
            href="/"
            className="inline-block text-blue-600 hover:text-blue-800 hover:underline"
          >
            Return to home
          </Link>
        </div>
      </div>
    </div>
  )
}