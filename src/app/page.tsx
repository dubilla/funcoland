import Image from "next/image";
import Link from "next/link";
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';

export default async function Home() {
  const session = await getServerSession();
  
  // If user is logged in, redirect to dashboard
  if (session) {
    redirect('/dashboard');
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-blue-50 to-blue-100">
      <div className="max-w-3xl w-full space-y-8 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-2">
          Organize Your Gaming Backlog
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Track your games, organize them into queues, and see how much time it will take to beat your backlog.
        </p>
        
        <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-blue-50 p-5 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Track Progress</h3>
              <p className="text-gray-600">Easily update and track your completion percentage for each game.</p>
            </div>
            <div className="bg-blue-50 p-5 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Create Queues</h3>
              <p className="text-gray-600">Organize your games into custom queues and prioritize what to play next.</p>
            </div>
            <div className="bg-blue-50 p-5 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Completion Times</h3>
              <p className="text-gray-600">See how long it will take to beat each game in your backlog with HowLongToBeat data.</p>
            </div>
          </div>
          
          <div className="mt-8">
            <Link 
              href="/signin" 
              className="inline-block bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Sign in to Get Started
            </Link>
          </div>
        </div>
        
        <p className="text-sm text-gray-500 mt-8">
          Powered by RAWG.io for game data and HowLongToBeat for completion times.
        </p>
      </div>
    </main>
  );
}
