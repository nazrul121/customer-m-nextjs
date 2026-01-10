"use client"; // Required for usePathname

import Link from "next/link";
import React from "react";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  FolderTree, 
  Zap, 
  Wallet, 
  UserCog ,
  PanelBottom
} from "lucide-react";

const menuItems = [
  { group: "General", items: [
    { name: "Overview", href: "/dashboard", icon: <PanelBottom size={20} /> },
    { name: "Dashbaord", href: "/dashboard/admin", icon: <LayoutDashboard size={20} /> },
    { name: "Customers", href: "/dashboard/admin/customers", icon: <Users size={20} /> },
  ]},
  { group: "Services", items: [
    { name: "Service Types", href: "/dashboard/admin/service-types", icon: <FolderTree size={20} /> },
    { name: "Services", href: "/dashboard/admin/services", icon: <Zap size={20} /> },
  ]},
  { group: "Finance", items: [
    { name: "Monthly Bills", href: "/dashboard/admin/bills", icon: <Wallet size={20} /> },
  ]},
  { group: "Users", items: [
    { name: "Users", href: "/dashboard/admin/users", icon: <UserCog size={20} /> },
  ]},
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <ul className="menu p-4 w-72 min-h-full bg-base-100 text-base-content border-r border-base-200">
      {/* Brand Logo */}
      <li className="mb-8 px-2">
        <Link href="/" className="text-xl font-black text-primary tracking-tighter hover:bg-transparent px-0">
          MICRO DATASOFT
        </Link>
      </li>

      {menuItems.map((section) => (
        <React.Fragment key={section.group}>
          <li className="menu-title opacity-40 uppercase text-[10px] font-bold tracking-widest mt-6 mb-1">
            {section.group}
          </li>
          
          {section.items.map((item) => {
            // Check if current path matches the link
            const isActive = pathname === item.href;

            return (
              <li key={item.href} className="mt-1">
                <Link 
                  href={item.href} 
                  className={`flex gap-3 px-4 py-3 transition-all duration-200 rounded-lg ${
                    isActive 
                      ? "bg-primary text-primary-content font-semibold shadow-md active:!bg-primary" 
                      : "hover:bg-base-200 text-base-content/70 hover:text-base-content"
                  }`}
                >
                  <span className={`${isActive ? "text-primary-content" : "text-primary"}`}>
                    {item.icon}
                  </span> 
                  {item.name}
                </Link>
              </li>
            );
          })}
        </React.Fragment>
      ))}
    </ul>
  );
}