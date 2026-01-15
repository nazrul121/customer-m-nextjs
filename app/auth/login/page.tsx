import { Metadata } from "next";
import LoginContents from "./contents";
import Link from "next/link";
import ThemeSwitcher from "@/app/components/ThemeSwitch";
import Image from "next/image";

export const metadata: Metadata = {
  title: 'Login page',
  description: 'Manage application users and roles.',
};

export default function LoginPage() {
  return (
    <>
    <nav className="navbar bg-base-100 px-4 sm:px-10 border-b border-base-200 sticky top-0 z-50">
          <div className="flex-1">
            <Link href={'/'}><Image src="/images/logo.png" alt="Micro Datasoft" 
              width={150}  height={40} priority className="h-10 w-auto"
            /></Link>
          </div>
          <div className="flex-none gap-4">
            <ThemeSwitcher />
            <Link href="/auth/register" className="btn btn-ghost btn-sm hidden sm:inline-flex">Register</Link>
          </div>
        </nav>
        <LoginContents />
    </>
    
  );
}