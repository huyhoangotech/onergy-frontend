"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  FaHome,
  FaMicrochip,
  FaSitemap,
  FaBell,
  FaUser,
  FaSignOutAlt,
} from "react-icons/fa";

export default function CustomerSidebar() {
  const router = useRouter();
  const pathname = usePathname();

  const menuItems = [
    {
      href: "/customer/home",
      icon: <FaHome />,
      label: "Dashboard",
    },
    {
      href: "/customer/devices",
      icon: <FaMicrochip />,
      label: "Devices",
    },
    {
      href: "/customer/sites",
      icon: <FaSitemap />,
      label: "Sites",
    },
    {
      href: "/customer/alarms",
      icon: <FaBell />,
      label: "Alarms",
    },
    {
      href: "/customer/profile",
      icon: <FaUser />,
      label: "Profile",
    },
  ];

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("customerToken");
      localStorage.removeItem("customer");
    }

    router.push("/customer/login");
  };

  return (
    <div className="fixed left-0 top-0 w-64 h-screen bg-white border-r border-gray-200 shadow-sm flex flex-col justify-between">
      {/* Header */}
      <div>
        <div className="p-6 text-center border-b">
          <h1 className="text-xl font-bold text-emerald-600">
            Customer Portal
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Device Monitoring
          </p>
        </div>

        {/* Menu */}
        <ul className="p-3 space-y-2">
          {menuItems.map((item, index) => {
            const isActive = pathname === item.href;

            return (
              <li key={index}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
                    isActive
                      ? "bg-emerald-100 text-emerald-700 font-semibold"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="text-sm">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Logout */}
      <div className="p-4 border-t">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border text-red-600 hover:bg-red-50 transition"
        >
          <FaSignOutAlt />
          <span className="text-sm font-medium">Đăng Xuất</span>
        </button>
      </div>
    </div>
  );
}