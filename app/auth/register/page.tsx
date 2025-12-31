import ThemeToggle from "@/app/components/ThemeSwitch";
import Image from "next/image";
import Link from "next/link";

export default function Register() {
    return (
        <div className="flex min-h-screen items-center justify-center font-sans bg-base-100">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center py-32 px-16 sm:items-start">
        
        {/* Header Section: Logo and Theme Button */}
        <div className="flex w-full items-center justify-between mb-12">
          <Image src={'/images/logo.png'} style={{ height: '50px', width: 'auto' }} 
            alt="Micro Datasoft" width={300} height={300} priority
          />
          <ThemeToggle />
        </div>

        {/* Content Section */}
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="text-3xl font-semibold tracking-tight text-base-content">
            Customer Managing App
          </h1>
          <p className="max-w-md text-lg leading-8 text-base-content/70">
            Register feature is not enabled <b>Right Now</b>{" "} Please 
            <Link href="/auth/login" className="font-medium hover:underline"> Login </Link>

          </p>
        </div>
   
      </main>
    </div>
    );
}