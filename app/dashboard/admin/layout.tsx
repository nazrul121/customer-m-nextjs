"use client";

import { useState } from "react";
import Header from "@/app/components/admin/Header";
import SideBar from "@/app/components/admin/Sidebar";
import "../../globals.css";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="drawer lg:drawer-open">
      {/* Mobile drawer toggle */}
      <input id="admin-drawer" type="checkbox" className="drawer-toggle" />

      {/* Main content */}
      <div className="drawer-content flex flex-col bg-base-200 min-h-screen">
        <Header
          collapsed={collapsed}
          onToggleSidebar={() => setCollapsed((prev) => !prev)}
        />

        <main className="p-1 md:p-2 flex-grow">
          {children}
        </main>

        <footer className="footer footer-center p-4 bg-base-100 border-t border-base-300">
          <aside>
            <p>© 2025 - Micro Datasoft Billing System</p>
          </aside>
        </footer>
      </div>

      {/* Sidebar */}
      <div className="drawer-side z-40">
        <label htmlFor="admin-drawer" className="drawer-overlay" />
        <SideBar collapsed={collapsed} />
      </div>
    </div>
  );
}
