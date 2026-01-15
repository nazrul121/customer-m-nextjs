import Image from "next/image";
import Link from "next/link";
import ThemeToggle from "./components/ThemeSwitch";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Home Page',
  description: 'Manage application users and roles.',
};

export default function Home() {
  return (
    <div className="min-h-screen bg-base-100 font-sans">
      {/* --- Navigation Bar --- */}
      <nav className="navbar bg-base-100 px-4 sm:px-10 border-b border-base-200 sticky top-0 z-50">
        <div className="flex-1">
          <Image 
            src="/images/logo.png" 
            alt="Micro Datasoft" 
            width={150} 
            height={40} 
            priority 
            className="h-10 w-auto"
          />
        </div>
        <div className="flex-none gap-4">
          <ThemeToggle />
          <Link href="/auth/login" className="btn btn-ghost btn-sm hidden sm:inline-flex">Login</Link>
          <Link href="/auth/register" className="btn btn-primary btn-sm">Get Started</Link>
        </div>
      </nav>

      {/* --- Hero Section --- */}
      <main className="hero min-h-[calc(100vh-64px)] bg-base-200/30 px-6">
        <div className="hero-content flex-col lg:flex-row-reverse gap-12 max-w-6xl">
          {/* Outer Container with Border and subtle tint */}
          <div className="w-full lg:w-1/2 flex justify-center p-4 sm:p-8 relative">
            <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full"></div>

            <div className="relative w-full max-w-md bg-base-100 border border-base-300 rounded-2xl shadow-2xl p-6 transition-all duration-500 hover:shadow-primary/5 overflow-hidden">
              
              {/* 1. Header with Status */}
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-sm font-bold text-base-content uppercase tracking-wider">Analytics View</h3>
                  <p className="text-xs text-base-content/50">Real-time customer metrics</p>
                </div>
                <div className="badge badge-success badge-sm gap-1 py-3 px-3 text-white">
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                  Live
                </div>
              </div>

              {/* 2. Mini Stat Cards Grid */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="p-3 bg-base-200/50 rounded-xl border border-base-content/5">
                  <p className="text-[10px] uppercase font-semibold opacity-50">Customers</p>
                  <p className="text-xl font-bold">1,284</p>
                </div>
                <div className="p-3 bg-base-200/50 rounded-xl border border-base-content/5">
                  <p className="text-[10px] uppercase font-semibold opacity-50">Growth</p>
                  <p className="text-xl font-bold text-primary">+12%</p>
                </div>
              </div>

              {/* 3. The "Visual Graph" Lines */}
              <div className="space-y-4 mb-6">
                <p className="text-[10px] uppercase font-semibold opacity-50 mb-2">Service Activity</p>
                <div className="flex items-end gap-2 h-20 px-2">
                    {/* Simulated Bar Graph */}
                    <div className="flex-1 bg-primary/20 rounded-t-sm h-[40%]"></div>
                    <div className="flex-1 bg-primary/40 rounded-t-sm h-[70%]"></div>
                    <div className="flex-1 bg-primary/60 rounded-t-sm h-[50%]"></div>
                    <div className="flex-1 bg-primary rounded-t-sm h-[90%]"></div>
                    <div className="flex-1 bg-primary/40 rounded-t-sm h-[30%]"></div>
                    <div className="flex-1 bg-primary/20 rounded-t-sm h-[60%]"></div>
                </div>
              </div>

              {/* 4. Sharp Progress Lines (The ones you wanted) */}
              <div className="space-y-3 border-t border-base-content/5 pt-6">
                <div className="h-2 w-full bg-base-content rounded-full opacity-100"></div>
                <div className="h-2 w-4/5 bg-base-content rounded-full opacity-40"></div>
              </div>

              {/* 5. Floating Action Button Hint */}
              <div className="absolute bottom-4 right-4 h-10 w-10 bg-primary rounded-full flex items-center justify-center text-primary-content shadow-lg cursor-pointer hover:scale-110 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </div>
            </div>
          </div>

          {/* Text Content */}
          <div className="w-full lg:w-1/2 text-center lg:text-left">
            <h1 className="text-5xl font-extrabold tracking-tight text-base-content leading-tight">
              Streamline Your <span className="text-primary">Customer</span> Experience.
            </h1>
            <p className="py-6 text-lg text-base-content/70 leading-relaxed">
              Welcome to Micro Datasoft. Manage your profile, view agreements, and explore our company services all in one secure place. 
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link href="/auth/register" className="btn btn-primary btn-lg shadow-lg shadow-primary/20">
                Register Now
              </Link>
              <Link href="/auth/login" className="btn btn-outline btn-lg">
                Member Login
              </Link>
            </div>

            <div className="mt-8 flex items-center gap-4 justify-center lg:justify-start text-sm opacity-60">
                <span className="flex items-center gap-1">✅ Secure Access</span>
                <span className="flex items-center gap-1">✅ Service Tracking</span>
                <span className="flex items-center gap-1">✅ Fast Support</span>
            </div>
          </div>
        </div>
      </main>

      {/* --- Footer --- */}
      <footer className="footer footer-center p-10 bg-base-100 text-base-content border-t border-base-200">
        <div>
          <p className="font-bold">
            Micro Datasoft Ltd. <br/>Providing reliable tech solutions since 1992
          </p> 
          <p>Copyright © {new Date().getFullYear()} - All right reserved</p>
        </div>
      </footer>
    </div>
  );
}