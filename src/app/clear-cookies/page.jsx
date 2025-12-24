'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function ClearCookies() {
  const [cleared, setCleared] = useState(false)

  useEffect(() => {
    // Clear all cookies
    document.cookie.split(';').forEach(cookie => {
      const [name] = cookie.trim().split('=')
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
    })

    setCleared(true)

    // Clear localStorage for good measure
    localStorage.clear()
  }, [])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-blue-100 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Cookies Cleared</h1>

        <div className="mb-6">
          <p className="text-gray-600">
            {cleared
              ? "All cookies have been cleared. You can now try signing in again."
              : "Clearing cookies..."}
          </p>
        </div>

        {cleared && (
          <div className="space-x-4">
            <Link
              href="/signin"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              Go to Sign In
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
