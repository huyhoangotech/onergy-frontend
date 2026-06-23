"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { 
  ArrowLeft,
  Loader,
  AlertCircle,
  Info,
  Clock,
  AlertTriangle,
  CheckCircle2
} from "lucide-react";
/* ================= TYPES ================= */
type MeasurementNode = {
  id: string;
  name: string;
  value: string | number | null;
  unit: string | null;
  children?: MeasurementNode[];
};

type AlarmLog = {
  id: string;
  event_type: string;
  severity: string;
  triggered_at: string;
  value?: string | number | null;
};

/* ================= PAGE ================= */
export default function DeviceDetailPage() {
  const { deviceId } = useParams<{ deviceId: string }>();

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("adminToken")
      : null;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [deviceName, setDeviceName] = useState("Unknown Device");
  const [measurements, setMeasurements] = useState<MeasurementNode[]>([]);
  const [alarms, setAlarms] = useState<AlarmLog[]>([]);
  const [activeTab, setActiveTab] = useState<
    "measurements" | "alarms"
  >("measurements");

  useEffect(() => {
    if (!deviceId) {
      setError("Missing deviceId");
      setLoading(false);
      return;
    }

    if (!token) {
      setError("Unauthorized. Please login again.");
      setLoading(false);
      return;
    }

    const authHeader = {
      Authorization: `Bearer ${token}`,
    };

    const loadAll = async () => {
      try {
        /* ================= DEVICE INFO ================= */
        const deviceRes = await api.get(
          `/api/admin/devices/${deviceId}`
        );

        const deviceData = deviceRes.data;
        setDeviceName(deviceData.device_name || "Unknown Device");

        /* ================= MEASUREMENTS ================= */
        const meaRes = await api.get(
          `/api/admin/devices/${deviceId}/measurements-tree`
        );

        setMeasurements(meaRes.data.measurements || []);

        /* ================= ALARMS ================= */
        try {
          const alarmRes = await api.get(
            `/api/admin/devices/${deviceId}/alarm-logs`
          );
          setAlarms(alarmRes.data.alarms || []);
        } catch {
          // alarm lỗi thì vẫn cho qua, không fail toàn bộ
          setAlarms([]);
        }

      } catch (err) {
        console.error("LOAD ERROR:", err);
        setError("Failed to load device data");
      } finally {
        setLoading(false);
      }
    };

    loadAll();
  }, [deviceId, token]);

  /* ================= UI ================= */

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-slate-600 font-medium">Đang tải dữ liệu thiết bị...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-4">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại
          </button>
          <div className="bg-white rounded-lg border border-red-200 p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <p className="text-red-600 font-medium">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* HEADER */}
      <div className="border-b border-slate-200 bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => window.history.back()}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              title="Quay lại"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{deviceName}</h1>
              <p className="text-sm text-slate-500 mt-1">Chi tiết thiết bị</p>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* TABS */}
        <div className="flex gap-1 border-b border-slate-200 bg-white rounded-t-lg p-4 mb-6">
          <button
            onClick={() => setActiveTab("measurements")}
            className={`px-4 py-2 font-medium text-sm transition-colors ${
              activeTab === "measurements"
                ? "text-blue-600 border-b-2 border-blue-600 -mb-4"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4" />
             Thông số
            </div>
          </button>

          <button
            onClick={() => setActiveTab("alarms")}
            className={`px-4 py-2 font-medium text-sm transition-colors ${
              activeTab === "alarms"
                ? "text-red-600 border-b-2 border-red-600 -mb-4"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Cảnh Báo ({alarms.length})
            </div>
          </button>
        </div>

        {/* ================= MEASUREMENTS ================= */}
        {activeTab === "measurements" && (
          <section className="space-y-4">
            {measurements.length === 0 ? (
              <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
                <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-4 opacity-50" />
                <p className="text-slate-600 font-medium">Không có dữ liệu đo lường</p>
                <p className="text-sm text-slate-500 mt-1">Thiết bị sẽ bắt đầu gửi dữ liệu khi được kết nối</p>
              </div>
            ) : (
              measurements.map((g) => (
                <div key={g.id} className="bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">{g.name}</h3>
                      <p className="text-2xl font-bold text-blue-600 mt-2">
                        {g.value ?? "-"} <span className="text-lg text-slate-500 font-normal">{g.unit ?? ""}</span>
                      </p>
                    </div>
                  </div>

                  {Array.isArray(g.children) && g.children.length > 0 && (
                    <div className="border-t border-slate-200 pt-4 mt-4">
                      <p className="text-sm font-medium text-slate-600 mb-3">Chi tiết:</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {g.children.map((c) => (
                          <div key={c.id} className="bg-slate-50 rounded p-3">
                            <p className="text-sm text-slate-600">{c.name}</p>
                            <p className="text-lg font-semibold text-slate-900 mt-1">
                              {c.value ?? "-"} <span className="text-sm font-normal text-slate-500">{c.unit ?? ""}</span>
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </section>
        )}

        {/* ================= ALARMS ================= */}
        {activeTab === "alarms" && (
          <section className="space-y-4">
            {alarms.length === 0 ? (
              <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
                <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-4 opacity-50" />
                <p className="text-slate-600 font-medium">Không có cảnh báo</p>
                <p className="text-sm text-slate-500 mt-1">Thiết bị đang hoạt động bình thường</p>
              </div>
            ) : (
              alarms.map((a) => {
                const severity = a.severity?.toUpperCase();
                const severityColor = 
                  severity === "CRITICAL" ? "red" :
                  severity === "HIGH" ? "orange" :
                  severity === "MEDIUM" ? "yellow" :
                  "green";
                
                const bgColor = {
                  red: "bg-red-50 border-red-200",
                  orange: "bg-orange-50 border-orange-200",
                  yellow: "bg-yellow-50 border-yellow-200",
                  green: "bg-green-50 border-green-200"
                }[severityColor];

                const textColor = {
                  red: "text-red-900",
                  orange: "text-orange-900",
                  yellow: "text-yellow-900",
                  green: "text-green-900"
                }[severityColor];

                const badgeBg = {
                  red: "bg-red-100 text-red-800",
                  orange: "bg-orange-100 text-orange-800",
                  yellow: "bg-yellow-100 text-yellow-800",
                  green: "bg-green-100 text-green-800"
                }[severityColor];

                return (
                  <div
                    key={a.id}
                    className={`rounded-lg border ${bgColor} p-4 hover:shadow-md transition-shadow`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <AlertTriangle className={`w-5 h-5 ${textColor}`} />
                          <h4 className={`font-semibold ${textColor}`}>
                            {a.event_type ?? "Unknown Alarm"}
                          </h4>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm opacity-75 mb-2">
                          <Clock className="w-4 h-4" />
                          {new Date(a.triggered_at).toLocaleString("vi-VN")}
                        </div>

                        {a.value && (
                          <p className={`text-sm ${textColor}`}>
                            Giá trị: <span className="font-semibold">{a.value}</span>
                          </p>
                        )}
                      </div>

                      <span className={`${badgeBg} text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap ml-4`}>
                        {a.severity}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </section>
        )}
      </div>
    </div>
  );
}
