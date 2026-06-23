"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FaHome,
  FaBox,
  FaChartBar,
  FaUsers,
  FaCog,
  FaCalendarAlt,
  FaComments,
  FaSignOutAlt,
} from "react-icons/fa";

export default function AdminSidebar() {
  const router = useRouter();

  const menuItems = [
    { href: "/admin/Home", icon: <FaHome />, label: "Dashboard" },
    { href: "/admin/devices", icon: <FaChartBar />, label: "Thiết bị" },
    { href: "/admin/device-type", icon: <FaChartBar />, label: "Device-type" },
    { href: "/admin/product-line", icon: <FaUsers />, label: "Product-line" },
    { href: "/admin/customers", icon: <FaUsers />, label: "Khách hàng" },
    { href: "/admin/users", icon: <FaChartBar />, label: "Users" },
    { href: "/admin/sites", icon: <FaChartBar />, label: "Sites" },
      { href: "/admin/gateways", icon: <FaChartBar />, label: "Gateway" },
    { href: "/admin/accounts", icon: <FaCalendarAlt />, label: "Tài khoản" },
    { href: "/admin/measurements", icon: <FaComments />, label: "Measurements" },
    { href: "/admin/test", icon: <FaUsers />, label: "Test" },
    { href: "/admin/discovery", icon: <FaBox />, label: "Device Discovery" },
   
  ];

 const handleLogout = () => {
   if (typeof window !== "undefined") {
     localStorage.removeItem("adminToken");
     localStorage.removeItem("adminInfo"); // nếu có
   }
 
   router.push("/login"); // hoặc "/login"
 };
 
  return (
    <div className="fixed w-64 h-full bg-white border-r border-gray-200 shadow text-black flex flex-col justify-between">
      <div>
        <div className="p-6 font-bold text-xl text-blue-600 text-center">Admin Panel</div>
        <ul className="space-y-1">
          {menuItems.map((item, index) => (
            <li key={index}>
              <Link
                href={item.href}
                className="flex flex-col items-center justify-center p-3 hover:bg-blue-100 rounded text-black"
              >
                <span className="text-lg">{item.icon}</span>
                <span className="text-sm">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Nút đăng xuất */}
      <div className="p-4">
        <button
          onClick={handleLogout}
          className="w-full flex flex-col items-center justify-center p-3 border rounded hover:bg-red-100 text-red-600"
        >
          <FaSignOutAlt className="text-lg" />
          <span className="text-sm">Đăng Xuất</span>
        </button>
      </div>
    </div>
  );
}