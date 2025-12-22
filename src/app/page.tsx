'use client';

import Link from "next/link";
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const { status } = useSession();
  const router = useRouter();

  // If user is logged in, redirect to dashboard
  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard');
    }
  }, [status, router]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0a0e27]">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-10 w-64 h-64 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
        <div className="absolute top-40 right-10 w-64 h-64 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-20 left-1/2 w-64 h-64 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]"></div>

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl w-full">
          {/* Hero Section */}
          <div className="text-center mb-16 animate-fade-in">
            <div className="mb-6 inline-block">
              <span className="text-cyan-400 text-sm font-mono tracking-widest uppercase animate-pulse">Your Gaming Command Center</span>
            </div>

            <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black mb-6 leading-none">
              <span className="inline-block bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 text-transparent bg-clip-text animate-gradient">
                FUNCOLAND
              </span>
            </h1>

            <p className="text-xl sm:text-2xl text-gray-300 mb-4 max-w-2xl mx-auto font-light leading-relaxed">
              Conquer your backlog with style. Track progress, queue games, and dominate your collection.
            </p>

            <div className="flex items-center justify-center gap-4 text-sm text-cyan-400 font-mono">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span>
                RAWG.io Powered
              </span>
              <span>•</span>
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse animation-delay-1000"></span>
                HowLongToBeat Data
              </span>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="group relative bg-gradient-to-br from-cyan-500/10 to-purple-500/10 backdrop-blur-sm border border-cyan-500/20 p-8 rounded-2xl hover:border-cyan-400/50 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(34,211,238,0.3)]">
              <div className="absolute top-4 right-4 text-4xl font-black text-cyan-500/20 group-hover:text-cyan-500/30 transition-colors">01</div>
              <div className="mb-4">
                <div className="w-12 h-12 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-400 text-2xl font-bold mb-4">
                  %
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Track Progress</h3>
                <p className="text-gray-400 leading-relaxed">Monitor completion percentages and watch your achievements stack up in real-time.</p>
              </div>
            </div>

            <div className="group relative bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm border border-purple-500/20 p-8 rounded-2xl hover:border-purple-400/50 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(168,85,247,0.3)]">
              <div className="absolute top-4 right-4 text-4xl font-black text-purple-500/20 group-hover:text-purple-500/30 transition-colors">02</div>
              <div className="mb-4">
                <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400 text-2xl font-bold mb-4">
                  ⚡
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Create Queues</h3>
                <p className="text-gray-400 leading-relaxed">Build custom playlists and prioritize your gaming roadmap like a boss.</p>
              </div>
            </div>

            <div className="group relative bg-gradient-to-br from-pink-500/10 to-cyan-500/10 backdrop-blur-sm border border-pink-500/20 p-8 rounded-2xl hover:border-pink-400/50 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(236,72,153,0.3)]">
              <div className="absolute top-4 right-4 text-4xl font-black text-pink-500/20 group-hover:text-pink-500/30 transition-colors">03</div>
              <div className="mb-4">
                <div className="w-12 h-12 rounded-lg bg-pink-500/20 flex items-center justify-center text-pink-400 text-2xl font-bold mb-4">
                  ⏱
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Know Your Time</h3>
                <p className="text-gray-400 leading-relaxed">Calculate exactly how long your backlog will take with HowLongToBeat integration.</p>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center">
            <Link
              href="/signin"
              className="group relative inline-flex items-center gap-3 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 text-white font-bold px-10 py-5 rounded-full text-lg overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_rgba(34,211,238,0.5)]"
            >
              <span className="relative z-10">Start Your Journey</span>
              <span className="relative z-10 text-2xl group-hover:translate-x-1 transition-transform">→</span>
              <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </Link>

            <p className="mt-6 text-gray-500 text-sm font-mono">
              No credit card required • Free forever
            </p>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes blob {
            0%, 100% {
              transform: translate(0, 0) scale(1);
            }
            33% {
              transform: translate(30px, -50px) scale(1.1);
            }
            66% {
              transform: translate(-20px, 20px) scale(0.9);
            }
          }

          @keyframes gradient {
            0%, 100% {
              background-position: 0% 50%;
            }
            50% {
              background-position: 100% 50%;
            }
          }

          @keyframes fade-in {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .animate-blob {
            animation: blob 7s infinite;
          }

          .animation-delay-2000 {
            animation-delay: 2s;
          }

          .animation-delay-4000 {
            animation-delay: 4s;
          }

          .animation-delay-1000 {
            animation-delay: 1s;
          }

          .animate-gradient {
            background-size: 200% 200%;
            animation: gradient 3s ease infinite;
          }

          .animate-fade-in {
            animation: fade-in 1s ease-out;
          }
        `
      }} />
    </main>
  );
}
