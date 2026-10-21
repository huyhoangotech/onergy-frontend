"use client";
import React from "react";
import CustomerSidebar from "@/components/CustomerSidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar - fixed */}
      <CustomerSidebar />

      {/* Main content với margin-left = sidebar width */}
      <div className="flex-1 ml-64 flex flex-col">
        {/* Topbar */}
        {/* Page Content */}
        <main className="flex-1 p-4 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}