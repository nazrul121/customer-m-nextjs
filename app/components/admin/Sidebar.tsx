"use client";

import Link from "next/link";
import React from "react";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FolderTree,
  Zap,
  Wallet,
  UserCog,
  PanelBottom,
  CalendarCheck,
} from "lucide-react";

type SidebarProps = {
  collapsed: boolean;
};

const menuItems = [
  {
    group: "General",
    items: [
      { name: "Overview", href: "/dashboard", icon: <PanelBottom size={20} /> },
      {
        name: "Dashboard",
        href: "/dashboard/admin",
        icon: <LayoutDashboard size={20} />,
      },
      {
        name: "Customers",
        href: "/dashboard/admin/customers",
        icon: <Users size={20} />,
      },
    ],
  },
  {
    group: "Services",
    items: [
      {
        name: "Service Types",
        href: "/dashboard/admin/service-types",
        icon: <FolderTree size={20} />,
      },
      {
        name: "Services",
        href: "/dashboard/admin/services",
        icon: <Zap size={20} />,
      },
    ],
  },
  {
    group: "Finance",
    items: [
      {
        name: "Monthly Bills",
        href: "/dashboard/admin/bills",
        icon: <CalendarCheck size={20} />,
      },
      {
        name: "Customer Ledger",
        href: "/dashboard/admin/gl",
        icon: <Wallet size={20} />,
      },
    ],
  },
  {
    group: "Users",
    items: [
      {
        name: "System Users",
        href: "/dashboard/admin/users",
        icon: <UserCog size={20} />,
      },
    ],
  },
];

export default function Sidebar({ collapsed }: SidebarProps) {
  const pathname = usePathname();

  return (
    <ul className={`menu min-h-full bg-base-100 border-r border-base-200 p-2 transition-all duration-300 flex flex-col ${collapsed ? "w-20" : "w-72"}`}>
      {/* Logo */}
      <div className="flex-1">
        <li className="mb-8 px-2 flex justify-center lg:justify-start">
        <Link href="/" className="text-xl font-black text-primary tracking-tighter">
          {collapsed ? "MD" : "Micro Datasoft"}
        </Link> 
      </li>
      </div>
        <div className="flex-7 flex flex-col justify-center">
          {menuItems.map((section) => (
        <React.Fragment key={section.group}>
          {!collapsed && (
            <li className="menu-title uppercase text-[10px] font-bold tracking-widest">
              {section.group}
            </li>
          )}

          {section.items.map((item) => {
            const isActive = pathname === item.href;

            return (
              <li key={item.href}>
                <Link href={item.href} data-tip={item.name}
                  className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-all tooltip ${!collapsed?'tooltip-top':'tooltip-right'}`}>
                  <span className={isActive ? "text-warning " : "text-primary"}>
                    {item.icon}
                  </span>

                  {!collapsed && <span className={isActive ? "text-warning " : "text-info"}>{item.name}</span>}
                </Link>
              </li>
            );
          })}

        </React.Fragment>
      ))}
        </div>
    </ul>
  );
}
