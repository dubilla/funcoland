'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import Link from 'next/link'

export default function SignInClientComponent() {
  const [isLogin, setIsLogin] = useState(true)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address')
      return
    }

    if (!password || password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      if (isLogin) {
        // Login process
        console.log('Attempting login with:', email)
        try {
          await signIn('credentials', {
            email,
            password,
            redirect: true,
            callbackUrl: '/dashboard',
            error: '/auth/error', // Explicitly set the error page
          })
          // We should never reach this point if redirect: true works correctly
          console.log('No redirect occurred after signIn')
        } catch (error) {
          console.error('Sign in error:', error)
          setError('Invalid email or password')
        }
      } else {
        // Registration process
        console.log('Attempting registration with:', email)
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name,
            email,
            password,
          }),
        })

        const data = await res.json()

        if (!res.ok) {
          throw new Error(data.error || 'Registration failed')
        }

        console.log('Registration successful:', data.user.email)

        // Auto login after successful registration
        try {
          await signIn('credentials', {
            email,
            password,
            redirect: true,
            callbackUrl: '/dashboard',
            error: '/auth/error', // Explicitly set the error page
          })
          // We should never reach this point if redirect: true works correctly
          console.log('No redirect occurred after registration signIn')
        } catch (error) {
          console.error('Auto-login after registration failed:', error)
          throw new Error('Registration successful but unable to sign in automatically. Please try signing in manually.')
        }
      }
    } catch (err) {
      console.error('Authentication error:', err)
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h2 className="text-xl font-semibold">
          {isLogin ? 'Sign in to your account' : 'Create a new account'}
        </h2>
        <p className="text-gray-600">
          {isLogin
            ? 'Sign in to track your game backlog and manage your gaming queues.'
            : 'Join FuncoLand to organize your game backlog like never before.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name field - only for registration */}
        {!isLogin && (
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Name (optional)
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        {/* Email field */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your.email@example.com"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Password field */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={isLogin ? '********' : 'Min. 8 characters'}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {error && (
          <div className="text-red-600 text-sm py-1">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md disabled:bg-blue-400"
        >
          {isLoading
            ? 'Processing...'
            : isLogin
              ? 'Sign In'
              : 'Create Account'}
        </button>
      </form>

      <div className="text-center">
        <button
          onClick={() => setIsLogin(!isLogin)}
          className="text-blue-600 hover:text-blue-800 hover:underline text-sm"
        >
          {isLogin
            ? "Don't have an account? Sign up"
            : "Already have an account? Sign in"}
        </button>
      </div>

      <div className="text-center mt-6">
        <p className="text-sm text-gray-600">
          By continuing, you agree to our{' '}
          <Link href="/terms" className="text-blue-600 hover:underline">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="text-blue-600 hover:underline">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  )
}

