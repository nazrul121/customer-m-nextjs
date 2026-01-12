"use client";

import ThemeToggle from "@/app/components/ThemeSwitch";
import { authClient } from "@/lib/auth-client";
import { LogOut, User2Icon } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Header() {
  const router = useRouter();
  
  // 1. Get the session data
  const { data: session, isPending } = authClient.useSession();

  // 2. Helper function to get initials
  const getInitials = (name: string | undefined | null) => {
    if (!name) return "??";
    return name
      .split(" ")                    // Split by space
      .map((word) => word[0])        // Take first character of each word
      .join("")                      // Join them
      .toUpperCase()                 // Make uppercase
      .substring(0, 2);              // Limit to 2 characters (optional)
  };

  return (
    <header className="navbar bg-base-100 border-b border-base-300 sticky top-0 z-30 px-4">
      <div className="flex-none lg:hidden">
        <label htmlFor="admin-drawer" className="btn btn-square btn-ghost drawer-button">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-5 h-5 stroke-current">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
          </svg>
        </label>
      </div>
      
      <div className="flex-1">
        <div className="hidden md:flex">
           <input type="text" placeholder="Search data..." className="input input-bordered input-sm w-64 focus:border-primary" />
        </div>
      </div>

      <div className="flex-none gap-4">
        <ThemeToggle />
        
        {/* User Dropdown */}
        <div className="dropdown dropdown-end">
          <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar border border-base-300">
            <div className="flex items-center justify-center w-10 rounded-full bg-primary text-primary-content font-bold">
              {/* 3. Display Initials or Loader */}
              {isPending ? (
                <span className="loading loading-spinner loading-xs"></span>
              ) : (
                <span className="text-sm tracking-tighter">
                  {getInitials(session?.user?.name)}
                </span>
              )}
            </div>
          </div>
          <ul tabIndex={0} className="mt-3 z-[100] p-2 shadow-xl menu menu-sm dropdown-content bg-base-100 rounded-xl w-52 border border-base-400">
            <li className="menu-title px-4 py-2 opacity-60">
                {session?.user?.name || "User Account"}
            </li>
            <div className="divider my-0 opacity-20"></div>
            <li><a><User2Icon size={20}/> Profile Settings</a></li>
			      <div className="divider my-0 opacity-20"></div>
            <li>
              <a className="text-error active:bg-error active:text-white" onClick={() => authClient.signOut({ fetchOptions: { onSuccess: () => router.push("/") } })} >
                <LogOut size={20} /> Logout
              </a>
            </li>
          </ul>
        </div>
      </div>
    </header>
  );
}