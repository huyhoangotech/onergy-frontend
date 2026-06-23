"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { 
  BarChart3, 
  Smartphone, 
  CheckCircle2, 
  AlertCircle, 
  Users, 
  LogOut,
  Clock,
  AlertTriangle,
  Loader
} from "lucide-react";

/* ================= TYPES ================= */
type Alarm = {
  id: string;
  description: string;
  severity: string;
  device_name?: string;
  triggered_at: string;
};

type Stats = {
  total_devices: number;
  connected: number;
  disconnected: number;
  total_customers: number;
};

/* ================= COMPONENT ================= */
export default function AdminHome() {
  const router = useRouter();

  /* ================= AUTH GUARD ================= */
  const [mounted, setMounted] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    setToken(localStorage.getItem("adminToken"));
  }, []);

  useEffect(() => {
    if (mounted && !token) {
      router.push("/login");
    }
  }, [mounted, token, router]);

  /* ================= STATE ================= */
  const [stats, setStats] = useState<Stats | null>(null);
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [loading, setLoading] = useState(true);

  /* ================= SEVERITY CONFIG ================= */
  const getSeverityStyle = (severity?: string) => {
    const s = severity?.toUpperCase();
    switch (s) {
      case "CRITICAL":
        return { bgColor: "bg-red-100", textColor: "text-red-800", borderColor: "border-red-300", badgeBg: "bg-red-600" };
      case "HIGH":
        return { bgColor: "bg-orange-100", textColor: "text-orange-800", borderColor: "border-orange-300", badgeBg: "bg-orange-600" };
      case "MEDIUM":
        return { bgColor: "bg-yellow-100", textColor: "text-yellow-800", borderColor: "border-yellow-300", badgeBg: "bg-yellow-600" };
      case "LOW":
        return { bgColor: "bg-green-100", textColor: "text-green-800", borderColor: "border-green-300", badgeBg: "bg-green-600" };
      default:
        return { bgColor: "bg-gray-100", textColor: "text-gray-800", borderColor: "border-gray-300", badgeBg: "bg-gray-600" };
    }
  };

  /* ================= LOGOUT ================= */
  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminInfo");
    }
    router.push("/login");
  };

  /* ================= LOAD DASHBOARD ================= */
  useEffect(() => {
    if (!mounted) return;

    const token = localStorage.getItem("adminToken");
    if (!token) return;

    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const [statsRes, alarmsRes] = await Promise.all([
          api.get("/api/admin/dashboard/summary"),
          api.get("/api/admin/dashboard/recent-alarms"),
        ]);

        setStats(statsRes.data);
        setAlarms(Array.isArray(alarmsRes.data) ? alarmsRes.data : []);
      } catch (err) {
        console.error("Dashboard error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [mounted]);

  /* ================= RENDER ================= */
  if (!mounted || !token) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-slate-600 font-medium">Đang tải dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* HEADER */}
      <header className="border-b border-slate-200 bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-100 rounded-lg">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Dashboard Admin</h1>
                <p className="text-sm text-slate-500">Quản lý thiết bị và cảnh báo hệ thống</p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Đăng xuất
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* STATS GRID */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* TOTAL DEVICES */}
            <div 
              onClick={() => router.push("/admin/devices")}
              className="p-6 bg-white rounded-lg border border-slate-200 shadow-sm cursor-pointer hover:shadow-md hover:border-blue-300 transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-slate-600">Tổng Thiết Bị</span>
                <Smartphone className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-3xl font-bold text-slate-900">{stats.total_devices}</div>
              <p className="text-xs text-slate-500 mt-2">Tất cả thiết bị trong hệ thống</p>
            </div>

            {/* CONNECTED */}
            <div 
              onClick={() => router.push("/admin/devices?status=connected")}
              className="p-6 bg-white rounded-lg border border-slate-200 shadow-sm cursor-pointer hover:shadow-md hover:border-green-300 transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-slate-600">Kết Nối</span>
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div className="text-3xl font-bold text-green-600">{stats.connected}</div>
              <p className="text-xs text-slate-500 mt-2">
                {stats.total_devices > 0 
                  ? `${((stats.connected / stats.total_devices) * 100).toFixed(0)}% hoạt động`
                  : "Không có thiết bị"
                }
              </p>
            </div>

            {/* DISCONNECTED */}
            <div 
              onClick={() => router.push("/admin/devices?status=disconnected")}
              className="p-6 bg-white rounded-lg border border-slate-200 shadow-sm cursor-pointer hover:shadow-md hover:border-red-300 transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-slate-600">Ngắt Kết Nối</span>
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div className="text-3xl font-bold text-red-600">{stats.disconnected}</div>
              <p className="text-xs text-slate-500 mt-2">
                {stats.total_devices > 0
                  ? `${((stats.disconnected / stats.total_devices) * 100).toFixed(0)}% cần chú ý`
                  : "Không có thiết bị"
                }
              </p>
            </div>

            {/* CUSTOMERS */}
            <div 
              onClick={() => router.push("/admin/customers")}
              className="p-6 bg-white rounded-lg border border-slate-200 shadow-sm cursor-pointer hover:shadow-md hover:border-purple-300 transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-slate-600">Khách Hàng</span>
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div className="text-3xl font-bold text-purple-600">{stats.total_customers}</div>
              <p className="text-xs text-slate-500 mt-2">Tổng số khách hàng</p>
            </div>
          </div>
        )}

        {/* RECENT ALARMS */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
          <div className="px-6 py-4 border-b border-slate-200">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <h2 className="text-lg font-bold text-slate-900">Cảnh Báo Gần Nhất</h2>
            </div>
            <p className="text-sm text-slate-500">Những sự cố và cảnh báo từ các thiết bị</p>
          </div>
          
          <div className="p-6">
            {alarms.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CheckCircle2 className="w-12 h-12 text-green-600 mb-4 opacity-50" />
                <p className="text-slate-700 font-medium">Không có cảnh báo</p>
                <p className="text-sm text-slate-500 mt-1">Tất cả thiết bị đều hoạt động bình thường</p>
              </div>
            ) : (
              <div className="space-y-3">
                {alarms.map((alarm) => {
                  const style = getSeverityStyle(alarm.severity);
                  return (
                    <div
                      key={alarm.id}
                      className={`flex items-start justify-between p-4 border-2 ${style.borderColor} rounded-lg ${style.bgColor} transition-colors hover:opacity-80`}
                    >
                      <div className="flex gap-4 flex-1 min-w-0">
                        <div className="mt-0.5 flex-shrink-0">
                          <AlertTriangle className={`w-5 h-5 ${style.textColor}`} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={`font-semibold ${style.textColor} truncate`}>
                            {alarm.device_name || "Thiết bị không xác định"}
                          </p>
                          <p className={`text-sm ${style.textColor} opacity-75 mt-1 line-clamp-2`}>
                            {alarm.description}
                          </p>
                          <div className={`flex items-center gap-1 mt-2 text-xs ${style.textColor} opacity-60`}>
                            <Clock className="w-3 h-3" />
                            {new Date(alarm.triggered_at).toLocaleString("vi-VN")}
                          </div>
                        </div>
                      </div>
                      <div className="flex-shrink-0 ml-4">
                        <span className={`${style.badgeBg} text-white text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap`}>
                          {alarm.severity}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
