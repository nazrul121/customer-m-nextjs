"use client";

import ThemeToggle from "@/app/components/ThemeSwitch";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";


export default function Header() {
  const router = useRouter();
  return (
    <header className="navbar bg-base-100 border-b border-base-300 sticky top-0 z-30">
      <div className="flex-none lg:hidden">
        <label htmlFor="admin-drawer" className="btn btn-square btn-ghost drawer-button">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-5 h-5 stroke-current"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
        </label>
      </div>
      
      <div className="flex-1">
        
        <div className="hidden md:flex ml-4">
           <input type="text" placeholder="Search data..." className="input input-bordered input-sm w-64" />
        </div>
      </div>

      <div className="flex-none gap-2">
        <ThemeToggle />
        {/* User Dropdown */}
        <div className="dropdown dropdown-end">
          <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
            <div className="flex content-center w-10 rounded-full bg-neutral text-neutral-content">
              <span className="text-xs">ADM</span>
            </div>
          </div>
          <ul tabIndex={0} className="mt-3 z-1 p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box w-52 border border-base-500">
            <li className="p-1"><a>Profile Settings</a></li>
            <li className="p-1"><a className="text-error"  onClick={() => authClient.signOut({ fetchOptions: { onSuccess: () => router.push("/") } })}>Logout</a></li>
          </ul>
        </div>
      </div>
    </header>
  );
}