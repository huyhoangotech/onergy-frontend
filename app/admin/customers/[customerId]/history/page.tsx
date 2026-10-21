"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import {
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Bar,
} from "recharts";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Loader,
  BarChart3,
  Filter
} from "lucide-react";

/* ================= TYPES ================= */

type TimeframeType =
  | "hour"
  | "day"
  | "week"
  | "month"
  | "year";

type Timeframe = {
  label: string;
  type: TimeframeType;
  from: number;
  to: number;
};

type Device = {
  device_id: string;
  name: string;
  is_using_storage?: boolean;
  path?: string;
  root_site_id?: string;
};
type Measurement = {
  measurement_id: string;
  name: string;
  unit?: string;
};

type ChartData = {
  measurement: Measurement;
  data: {
    bucket: string;
    avg_value: number;
    min_value: number;
    max_value: number;
  }[];
};

/* ================= TIMEFRAME ================= */

const buildRange = (type: TimeframeType): Timeframe => {
  const now = new Date();

  switch (type) {
    case "hour": {
      // làm tròn xuống mốc 15 phút gần nhất
      const minutes = now.getMinutes();
      const roundedMinutes = Math.floor(minutes / 15) * 15;

      now.setMinutes(roundedMinutes);
      now.setSeconds(0);
      now.setMilliseconds(0);

      const to = now.getTime();

      return {
        label: "Last hour",
        type,
        from: to - 60 * 60 * 1000,
        to,
      };
    }

    case "day": {
      // làm tròn về đầu giờ
      now.setMinutes(0);
      now.setSeconds(0);
      now.setMilliseconds(0);

      const to = now.getTime();

      return {
        label: "Last 24h",
        type,
        from: to - 24 * 60 * 60 * 1000,
        to,
      };
    }

    case "week": {
      // làm tròn về đầu ngày
      now.setHours(0, 0, 0, 0);

      const to = now.getTime();

      return {
        label: "Last 7 days",
        type,
        from: to - 7 * 24 * 60 * 60 * 1000,
        to,
      };
    }

    case "month": {
      now.setHours(0, 0, 0, 0);

      const to = now.getTime();

      return {
        label: "Last month",
        type,
        from: to - 30 * 24 * 60 * 60 * 1000,
        to,
      };
    }

    case "year": {
      // làm tròn về đầu tháng
      now.setDate(1);
      now.setHours(0, 0, 0, 0);

      const to = now.getTime();

      return {
        label: "This year",
        type,
        from: to - 365 * 24 * 60 * 60 * 1000,
        to,
      };
    }
  }
};
const formatBucket = (
  timestamp: string | number,
  type: TimeframeType
) => {
  const date = new Date(timestamp);

  switch (type) {
    case "hour":
      // 15:30
      return date.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      });

    case "day":
      // 15:00
      return date.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
      });

    case "week":
      // 24/02
      return date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
      });

    case "month":
      // 24/02
      return date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
      });

    case "year":
      // 02/2026
      return date.toLocaleDateString("vi-VN", {
        month: "2-digit",
        year: "numeric",
      });
  }
};
const timeframeOptions: {
  label: string;
  type: TimeframeType;
}[] = [
  { label: "Last hour", type: "hour" },
  { label: "Last 24h", type: "day" },
  { label: "Last 7 days", type: "week" },
  { label: "Last 30 days", type: "month" },
  { label: "This year", type: "year" },
];

/* ================= COMPONENT ================= */

export default function AdminHistoryPage() {
  const { customerId } =
    useParams<{ customerId: string }>();

  const [devices, setDevices] = useState<Device[]>([]);
  const [measurements, setMeasurements] =
    useState<Measurement[]>([]);

  const [selectedDevice, setSelectedDevice] =
    useState("");

  const [selectedMeasurements, setSelectedMeasurements] =
    useState<string[]>([]);

  const [timeframe, setTimeframe] =
    useState<Timeframe>(buildRange("day"));

  const [charts, setCharts] =
    useState<ChartData[]>([]);

  /* ================= LOAD DEVICES ================= */

  useEffect(() => {
    if (!customerId) return;
    loadDevices();
  }, [customerId]);

  const loadDevices = async () => {
    try {
      const res = await api.get(
  `/api/admin/customers/${customerId}/devices`
);

const devices: Device[] =
  res.data?.data ?? [];

      const sorted = devices.sort(
  (a, b) =>
    Number(b.is_using_storage) -
    Number(a.is_using_storage)
);
      setDevices(sorted);

      if (sorted.length) {
        setSelectedDevice(sorted[0].device_id);
        setSelectedMeasurements([]);
        setCharts([]);
      }
    } catch (err) {
      console.error("Load devices error:", err);
    }
  };

  /* ================= LOAD MEASUREMENTS ================= */

  useEffect(() => {
    if (!selectedDevice) return;
    loadMeasurements();
  }, [selectedDevice]);

  const loadMeasurements = async () => {
    try {
      const [measurementRes, historyRes] =
        await Promise.all([
          api.get(
            `/api/admin/devices/${selectedDevice}/measurements`
          ),
          api.get(
            `/api/admin/devices/${selectedDevice}/history-config`
          ),
        ]);

      const measurements =
        measurementRes.data?.data ?? [];

      const history =
        historyRes.data?.data ?? [];

      const enabledSet = new Set(
        history.map((h: any) => h.measurement_id)
      );

      const enabledMeasurements = measurements.filter(
        (m: Measurement) =>
          enabledSet.has(m.measurement_id)
      );

      setMeasurements(enabledMeasurements);
    } catch (err) {
      console.error("Load measurements error:", err);
    }
  };

  /* ================= FETCH HISTORY ================= */

  useEffect(() => {
    if (
      !selectedDevice ||
      selectedMeasurements.length === 0
    ) 
    
      return;

    fetchHistory();
  }, [selectedDevice, selectedMeasurements, timeframe]);

  const fetchHistory = async () => {
    try {
      const responses = await Promise.all(
        selectedMeasurements.map((measurementId) =>
          api.get(
            `/api/admin/devices/${selectedDevice}/measurements/${measurementId}/history`,
            {
              params: {
                from: timeframe.from,
                to: timeframe.to,
                type: timeframe.type,
              },
            }
          )
        )
      );

      const formatted: ChartData[] =
        responses.map((res, i) => ({
          measurement: measurements.find(
            (m) =>
              m.measurement_id ===
              selectedMeasurements[i]
          )!,
data: (res.data?.data ?? []).map((d: any) => ({
  ...d,
  bucket: formatBucket(d.bucket, timeframe.type),
})),

        }));

      setCharts(formatted);
    } catch (err) {
      console.error("Fetch history error:", err);
    }
  };

  /* ================= SELECT MEASUREMENT ================= */

  const toggleMeasurement = (id: string) => {
    setSelectedMeasurements((prev) => {
      if (prev.includes(id))
        return prev.filter((m) => m !== id);

      if (prev.length >= 3) return prev;

      return [...prev, id];
    });
  };
 const groupedDevices = devices.reduce(
  (acc, device) => {
    const siteName =
      device.path?.split(" > ")[0] ??
      "Unknown Site";

    if (!acc[siteName]) {
      acc[siteName] = [];
    }

    acc[siteName].push(device);

    return acc;
  },
  {} as Record<string, Device[]>
);

  /* ================= UI ================= */

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* HEADER */}
      <div className="border-b border-slate-200 bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => window.history.back()}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              title="Go back"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-100 rounded-lg">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Customer History</h1>
                <p className="text-sm text-slate-500 mt-1">View device measurements and trends</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* FILTERS SECTION */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 mb-8">
          <div className="flex items-center gap-2 mb-6">
            <Filter className="w-5 h-5 text-slate-600" />
            <h2 className="text-lg font-bold text-slate-900">Filters</h2>
          </div>

          <div className="space-y-6">
            {/* DEVICE SELECT */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Select Device
              </label>
            <select
  value={selectedDevice}
  onChange={(e) => {
    setSelectedDevice(e.target.value);
    setSelectedMeasurements([]);
    setCharts([]);
  }}
>
  <option value="">
    -- Choose device --
  </option>

  {Object.entries(groupedDevices).map(
    ([siteName, siteDevices]) => (
      <optgroup
        key={siteName}
        label={siteName}
      >
        {siteDevices.map((d) => (
          <option
            key={d.device_id}
            value={d.device_id}
          >
            {d.name}
          </option>
        ))}
      </optgroup>
    )
  )}
</select>
            </div>

            {/* MEASUREMENTS */}
            {selectedDevice && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Select Measurements <span className="text-slate-500 text-xs">(max 3)</span>
                </label>
                {measurements.length === 0 ? (
                  <p className="text-sm text-slate-500">No measurements available for this device</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {measurements.map((m) => {
                      const checked = selectedMeasurements.includes(m.measurement_id);
                      return (
                        <button
                          key={m.measurement_id}
                          onClick={() => toggleMeasurement(m.measurement_id)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            checked
                              ? "bg-blue-600 text-white"
                              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                          }`}
                        >
                          {m.name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TIME RANGE */}
            {selectedMeasurements.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Time Range
                </label>
                <div className="flex flex-wrap gap-2">
                  {timeframeOptions.map((t) => (
                    <button
                      key={t.label}
                      onClick={() => setTimeframe(buildRange(t.type))}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        timeframe.type === t.type
                          ? "bg-slate-900 text-white"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* CHARTS SECTION */}
        {selectedMeasurements.length === 0 ? (
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-12 text-center">
            <BarChart3 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 font-medium">No data to display</p>
            <p className="text-sm text-slate-500 mt-1">Select a device and measurements to view the chart</p>
          </div>
        ) : (
          <div className="space-y-8">
            {charts.map((chart) => (
              <div
                key={chart.measurement.measurement_id}
                className="bg-white rounded-lg border border-slate-200 shadow-sm p-6"
              >
                <h2 className="text-lg font-bold text-slate-900 mb-6">
                  {chart.measurement.name}
                  <span className="text-slate-500 font-normal ml-2">
                    ({chart.measurement.unit || "N/A"})
                  </span>
                </h2>

                <ResponsiveContainer width="100%" height={400}>
                  <ComposedChart
                    data={chart.data}
                    margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="bucket" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#ffffff",
                        border: "1px solid #e2e8f0",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />

                    <Bar
                      dataKey="avg_value"
                      fill="#10b981"
                      name="Average"
                      radius={[6, 6, 0, 0]}
                      barSize={32}
                    />

                    <Line
                      type="monotone"
                      dataKey="max_value"
                      stroke="#ef4444"
                      strokeWidth={2}
                      dot={false}
                      name="Max"
                    />

                    <Line
                      type="monotone"
                      dataKey="min_value"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={false}
                      name="Min"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
