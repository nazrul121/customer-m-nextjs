// components/admin/Sidebar.tsx
import Link from "next/link";
import React from "react";

const menuItems = [
  { group: "General", items: [
    { name: "Overview", href: "/dashboard/", icon: "📊" },
    { name: "Customers", href: "/dashboard/admin/customers", icon: "👥" },
  ]},
  { group: "Services", items: [
    { name: "Service Types", href: "/dashboard/admin/service-types", icon: "📂" },
    { name: "Services", href: "/dashboard/admin/services", icon: "⚡" },
    { name: "Subscriptions", href: "/dashboard/admin/customer-services", icon: "📝" },
  ]},
  { group: "Finance", items: [
    { name: "Monthly Bills", href: "/admin/bills", icon: "💰" },
  ]},
];

export default function Sidebar() {
  return (
    <>
      <ul className="menu p-4 w-70 min-h-full bg-base-100 text-base-content">
        <li className="mb-6 px-4">
          <span className="text-lg font-black text-primary tracking-widest uppercase">
          <Link href={'/'}> Micro Datasoft</Link>
          </span>
        </li>
          {menuItems.map((section) => (
            <React.Fragment key={section.group}>
              <li className="menu-title opacity-50 uppercase text-xs mt-4">{section.group}</li>
              {section.items.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="flex gap-3">
                    <span>{item.icon}</span> {item.name}
                  </Link>
                </li>
              ))}
            </React.Fragment>
          ))}
      </ul>
    </>
  );
}