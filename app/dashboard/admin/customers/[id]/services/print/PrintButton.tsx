"use client"; // 🔑 This is the important part

import { Printer } from "lucide-react";

export default function PrintButton() {
  return (
    <button 
      onClick={() => window.print()} 
      className="btn btn-primary btn-sm gap-2 no-print"
    >
      <Printer size={16} /> Print Invoice
    </button>
  );
}