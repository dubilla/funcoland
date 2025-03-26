'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import Image from 'next/image'

export default function Header() {
  const { data: session, status } = useSession()
  const [menuOpen, setMenuOpen] = useState(false)
  
  // Debug logging for authentication
  useEffect(() => {
    console.log('Session status:', status)
    console.log('Session data:', session)
    
    if (status === 'authenticated') {
      console.log('User is authenticated:', session.user.name || session.user.email)
    } else if (status === 'loading') {
      console.log('Session is loading...')
    } else {
      console.log('No active session')
    }
  }, [session, status])
  
  const toggleMenu = () => setMenuOpen(prev => !prev)
  
  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center">
              <span className="text-xl font-bold text-blue-600">FuncoLand</span>
            </Link>
          </div>
          
          {/* Desktop navigation */}
          <nav className="hidden md:flex space-x-8">
            {session && (
              <>
                <Link href="/dashboard" className="text-gray-700 hover:text-blue-600">
                  Dashboard
                </Link>
                <Link href="/games" className="text-gray-700 hover:text-blue-600">
                  My Games
                </Link>
                <Link href="/queues" className="text-gray-700 hover:text-blue-600">
                  Queues
                </Link>
                <Link href="/games/add" className="text-gray-700 hover:text-blue-600">
                  Add Games
                </Link>
              </>
            )}
          </nav>
          
          {/* User menu */}
          <div className="hidden md:flex items-center">
            {status === 'loading' ? (
              <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse"></div>
            ) : session ? (
              <div className="relative">
                <button 
                  onClick={toggleMenu}
                  className="flex items-center space-x-2 focus:outline-none"
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200">
                    {session?.user?.image ? (
                      <Image
                        src={session.user.image}
                        alt={session.user.name || 'User'}
                        width={32}
                        height={32}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500">
                        {session?.user?.name ? session.user.name[0].toUpperCase() : 'U'}
                      </div>
                    )}
                  </div>
                  <span className="text-gray-700">
                    {session?.user?.name || session?.user?.email || 'User'}
                  </span>
                </button>
                
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                    <Link 
                      href="/profile" 
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                      onClick={() => setMenuOpen(false)}
                    >
                      Profile
                    </Link>
                    <button
                      onClick={() => {
                        setMenuOpen(false)
                        signOut({ callbackUrl: '/' })
                      }}
                      className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link 
                href="/signin" 
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
              >
                Sign in
              </Link>
            )}
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button 
              onClick={toggleMenu}
              className="text-gray-500 hover:text-gray-700 focus:outline-none"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {menuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden">
          <div className="bg-white pt-2 pb-3 space-y-1">
            {session ? (
              <>
                <Link 
                  href="/dashboard" 
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                  onClick={() => setMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link 
                  href="/games" 
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                  onClick={() => setMenuOpen(false)}
                >
                  My Games
                </Link>
                <Link 
                  href="/queues" 
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                  onClick={() => setMenuOpen(false)}
                >
                  Queues
                </Link>
                <Link 
                  href="/games/add" 
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                  onClick={() => setMenuOpen(false)}
                >
                  Add Games
                </Link>
                <Link 
                  href="/profile" 
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                  onClick={() => setMenuOpen(false)}
                >
                  Profile
                </Link>
                <button
                  onClick={() => {
                    setMenuOpen(false)
                    signOut({ callbackUrl: '/' })
                  }}
                  className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link 
                href="/signin" 
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                onClick={() => setMenuOpen(false)}
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  )
}