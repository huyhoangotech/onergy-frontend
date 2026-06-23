"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import {
  Activity,
  Cpu,
  Gauge,
  MapPin,
  Plug,
  Settings,
  Wifi,
  WifiOff,
  Zap,
} from "lucide-react";

type Device = {
  id: string;
  name: string;
  type?: string;
  location: string;
  status: "Connected" | "Disconnected";
};

const getDeviceIcon = (type?: string) => {
  switch (type) {
    case "Recloser":
    case "Relay":
      return <Zap className="w-6 h-6 text-emerald-600" />;
    case "Meter":
      return <Gauge className="w-6 h-6 text-emerald-600" />;
    case "Transformer":
      return <Plug className="w-6 h-6 text-emerald-600" />;
    default:
      return <Cpu className="w-6 h-6 text-emerald-600" />;
  }
};

export default function CustomerDashboardPage() {
  const router = useRouter();

  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);

  const [kpi, setKpi] = useState({
    total: 0,
    online: 0,
    offline: 0,
  });

 const fetchDashboard = async () => {
  try {
    const token = localStorage.getItem("customerToken");

    console.log("=== DASHBOARD DEBUG START ===");
    console.log("Current URL:", window.location.href);
    console.log("Customer token:", token);

    if (!token) {
      console.error("TOKEN NOT FOUND");
      return;
    }

    const headers = {
      Authorization: `Bearer ${token}`,
    };

    console.log("Request headers:", headers);

    const [treeRes, deviceRes] = await Promise.all([
      api.get("/api/customer/all-devices-tree", {
        headers,
      }),
      api.get("/api/customer/user-devices", {
        headers,
      }),
    ]);

    console.log("Tree response:", treeRes.data);
    console.log("Device response:", deviceRes.data);

    const allDevices = treeRes.data.devices;

    const total = allDevices.length;
    const online = allDevices.filter(
      (d: any) => d.status === "connected"
    ).length;

    setKpi({
      total,
      online,
      offline: total - online,
    });

    const mapped: Device[] = deviceRes.data.data
      .filter((d: any) => d.is_visible === 1)
      .map((d: any) => ({
        id: d.device_id,
        name: d.name,
        type: d.type,
        location: d.location,
        status:
          d.status === "connected"
            ? "Connected"
            : "Disconnected",
      }));

    setDevices(mapped);
  } catch (err: any) {
    console.error("DASHBOARD API ERROR:", err);
    console.error("Response:", err.response?.data);
    console.error("Status:", err.response?.status);
  } finally {
    setLoading(false);
  }
};

 useEffect(() => {
  console.log("PAGE LOADED");
  console.log(
    "Stored token:",
    localStorage.getItem("customerToken")
  );

  fetchDashboard();
}, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading dashboard...
      </div>
    );
  }

return (
  <div className="min-h-screen bg-emerald-50 ml-64">
      {/* HEADER */}
      <div className="bg-gradient-to-r from-emerald-800 via-emerald-600 to-emerald-400 rounded-b-3xl px-8 py-8 shadow-lg">
        <div className="flex justify-between items-start mb-8">
          <div>
            <p className="text-white/80 text-sm">
              Welcome back
            </p>
            <h1 className="text-3xl font-bold text-white mt-1">
              Device Monitoring
            </h1>
          </div>

          <button
            onClick={() =>
              router.push("/customer/device-config")
            }
            className="bg-white/20 p-3 rounded-xl hover:bg-white/30"
          >
            <Settings className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KpiCard
            icon={<Activity className="w-5 h-5 text-emerald-500" />}
            value={kpi.total}
            label="Total Devices"
          />

          <KpiCard
            icon={<Wifi className="w-5 h-5 text-green-500" />}
            value={kpi.online}
            label="Online"
          />

          <KpiCard
            icon={<WifiOff className="w-5 h-5 text-red-500" />}
            value={kpi.offline}
            label="Offline"
          />
        </div>
      </div>

      {/* DEVICE SECTION */}
      <div className="px-8 py-8">
        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            My Devices
          </h2>

          <span className="bg-emerald-600 text-white text-sm px-3 py-1 rounded-full">
            {devices.length}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {devices.map((device) => (
            <DeviceCard
              key={device.id}
              device={device}
              onClick={() =>
                router.push(
                  `/customer/measurement/${device.id}`
                )
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* KPI CARD */
function KpiCard({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow">
      <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center mb-3">
        {icon}
      </div>

      <h3 className="text-3xl font-bold text-gray-800">
        {value}
      </h3>

      <p className="text-sm text-gray-500 mt-1">
        {label}
      </p>
    </div>
  );
}

/* DEVICE CARD */
function DeviceCard({
  device,
  onClick,
}: {
  device: Device;
  onClick: () => void;
}) {
  const connected = device.status === "Connected";

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl p-5 shadow hover:shadow-lg cursor-pointer transition"
    >
      <div
        className={`w-3 h-3 rounded-full mb-4 ${
          connected
            ? "bg-green-500"
            : "bg-red-500"
        }`}
      />

      <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4">
        {getDeviceIcon(device.type)}
      </div>

      <h3 className="font-bold text-gray-800">
        {device.name}
      </h3>

      <p className="text-sm text-emerald-600 font-medium mt-1">
        {device.type || "Device"}
      </p>

      <div className="flex items-center gap-2 mt-3 text-gray-500 text-sm">
        <MapPin className="w-4 h-4" />
        <span>{device.location}</span>
      </div>

      <div
        className={`mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${
          connected
            ? "bg-green-50 text-green-600"
            : "bg-red-50 text-red-600"
        }`}
      >
        {connected ? (
          <Wifi className="w-4 h-4" />
        ) : (
          <WifiOff className="w-4 h-4" />
        )}
        {device.status}
      </div>
    </div>
  );
}