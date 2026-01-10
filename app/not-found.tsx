import Image from "next/image";
import Link from "next/link";
import ThemeToggle from "./components/ThemeSwitch";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: '404 Page',
  description: 'page not found',
};

export default function NotFound() {
    return (
        <div className="flex min-h-screen items-center justify-center font-sans bg-base-100">
        <main className="w-full max-w-3xl flex flex-col items-center py-20 px-16  border rounded-lg dark:border-gray-600">
            
            <div className="flex w-full items-center justify-between mb-12">
                <Image src="/images/logo.png"  alt="Micro Datasoft" width={300}
                    height={300}  priority  style={{ height: "50px", width: "auto" }}
                /><ThemeToggle />
            </div>

            <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
            <h1 className="text-3xl font-semibold tracking-tight text-base-content">
                404 - Page not found!
            </h1>

            <hr className="border-b border-gray-600 w-full" />

            <p className="max-w-md text-lg leading-8 text-base-content/70">
              The page you are looking for is not found! <br />Please {" "}
                <Link href="/" className="font-medium hover:underline">Get back to <b>Home</b></Link>{" "}
            </p>
            </div>
        </main>
        </div>
    );
}   