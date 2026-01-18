"use client";

import ThemeToggle from "@/app/components/ThemeSwitch";
import { authClient } from "@/lib/auth-client";
import {
  LogOut,
  User2Icon,
  PanelLeftClose,
  PanelLeftOpen,
  AlignCenterHorizontalIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";

type HeaderProps = {
  collapsed: boolean;
  onToggleSidebar: () => void;
};

export default function Header({
  collapsed,
  onToggleSidebar,
}: HeaderProps) {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  const getInitials = (name?: string | null) => {
    if (!name) return "??";
    return name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="navbar bg-base-100 border-b border-base-300 sticky top-0 z-30 px-4">
      <div className="flex-1 flex items-center gap-2">
        {/* Mobile drawer toggle */}
        <label htmlFor="admin-drawer" className="btn btn-square btn-ghost lg:hidden">
          <AlignCenterHorizontalIcon size={18} />
        </label>

        {/* Desktop collapse toggle */}
        <button
          onClick={onToggleSidebar}
          className="btn btn-square btn-ghost hidden lg:flex"
        >
          {collapsed ? (
            <PanelLeftOpen size={20} />
          ) : (
            <PanelLeftClose size={20} />
          )}
        </button>
      </div>

      <div className="flex-none gap-4">
        <ThemeToggle />

        {/* User Dropdown */}
        <div className="dropdown dropdown-end">
          <div
            tabIndex={0}
            role="button"
            className="btn btn-ghost btn-circle avatar border border-base-300"
          >
            <div className="flex items-center justify-center w-10 rounded-full bg-primary text-primary-content font-bold">
              {isPending ? (
                <span className="loading loading-spinner loading-xs" />
              ) : (
                <span className="text-sm tracking-tighter">
                  {getInitials(session?.user?.name)}
                </span>
              )}
            </div>
          </div>

          <ul
            tabIndex={0}
            className="mt-3 z-[100] p-2 shadow-xl menu menu-sm dropdown-content bg-base-100 rounded-xl w-52 border border-base-300"
          >
            <li className="menu-title px-4 py-2 opacity-60">
              {session?.user?.name || "User Account"}
            </li>

            <div className="divider my-0 opacity-20" />

            <li>
              <a>
                <User2Icon size={18} /> Profile Settings
              </a>
            </li>

            <div className="divider my-0 opacity-20" />

            <li>
              <a
                className="text-error active:bg-error active:text-white"
                onClick={() =>
                  authClient.signOut({
                    fetchOptions: {
                      onSuccess: () => router.push("/"),
                    },
                  })
                }
              >
                <LogOut size={18} /> Logout
              </a>
            </li>
          </ul>
        </div>
      </div>
    </header>
  );
}
