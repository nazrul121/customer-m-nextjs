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
    <div className="flex min-h-screen items-center justify-center font-sans bg-base-100">
      <main className="w-full max-w-3xl flex flex-col items-center py-20 px-16  border rounded-lg dark:border-gray-600">
        
        <div className="flex w-full items-center justify-between mb-12">
          <Image src="/images/logo.png"  alt="Micro Datasoft" width={300}
            height={300}  priority  style={{ height: "50px", width: "auto" }}
          />
          <ThemeToggle />
        </div>

        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="text-3xl font-semibold tracking-tight text-base-content">
            Customer Managing App
          </h1>

          <hr className="border-b border-gray-600 w-full" />

          <p className="max-w-md text-lg leading-8 text-base-content/70">
            You have to login first to continue{" "}
            <Link href="/auth/login" className="font-medium hover:underline">
              Login
            </Link>{" "}
            Or{" "}
            <Link href="/auth/register" className="font-medium hover:underline">
              Register
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
