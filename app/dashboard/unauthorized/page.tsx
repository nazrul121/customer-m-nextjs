import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
      <div className="bg-error/10 p-6 rounded-full text-error mb-6">
        <ShieldAlert size={64} />
      </div>
      <h1 className="text-4xl font-black mb-2">Access Denied</h1>
      <p className="text-base-content/60 max-w-md mb-8">
        Oops! You don't have the required permissions to view this section. 
        Please contact your administrator if you think this is a mistake.
      </p>
      <Link href="/dashboard" className="btn btn-primary">
        Back to My Dashboard
      </Link>
    </div>
  );
}