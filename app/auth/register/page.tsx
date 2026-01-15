import { Metadata } from "next";
import RegisterContents from "./components";
import Image from "next/image";
import ThemeSwitcher from "@/app/components/ThemeSwitch";
import Link from "next/link";

export const metadata: Metadata = {
  title: 'Register page',
  description: 'Manage application users and roles.',
};

export default function RegisterPage() {
  return (
    <div>
        <nav className="navbar bg-base-100 px-4 sm:px-10 border-b border-base-200 sticky top-0 z-50">
          <div className="flex-1">
            <Link href={'/'}><Image src="/images/logo.png" alt="Micro Datasoft" 
              width={150}  height={40} priority className="h-10 w-auto"
            /></Link>
          </div>
          <div className="flex-none gap-4">
            <ThemeSwitcher />
            <Link href="/auth/login" className="btn btn-ghost btn-sm hidden sm:inline-flex">Login</Link>
          </div>
        </nav>
        <RegisterContents />
    </div>
  );
}