import SignInClientComponent from './SignInClientComponent'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'

export default async function SignIn() {
  // Check if user is already signed in
  const session = await getServerSession(authOptions)
  
  if (session) {
    redirect('/dashboard')
  }
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-blue-100 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold text-center mb-6">Sign In</h1>
        <SignInClientComponent />
      </div>
    </div>
  )
}
