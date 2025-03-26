import type { Metadata } from "next";
import { Inter } from "next/font/google";
import ClientLayout from './clientLayout';
import Header from '@/components/Header';
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FuncoLand - Manage Your Game Backlog",
  description: "Track your video game backlog, organize games into queues, and see how long it will take to beat your collection.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 min-h-screen`}>
        <ClientLayout>
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow">
              {children}
            </main>
            <footer className="bg-white py-6 border-t">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <p className="text-center text-sm text-gray-500">
                  &copy; {new Date().getFullYear()} FuncoLand. All rights reserved.
                </p>
              </div>
            </footer>
          </div>
        </ClientLayout>
      </body>
    </html>
  );
}
