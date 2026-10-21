
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import {
  ArrowLeft,
  Building2,
  Cable,
  ChevronRight,
  Circle,
  Cpu,
  MapPin,
  RefreshCw,
  Search,
} from "lucide-react";

type Device = {
  device_id: string | number;
  name: string;
  type: string;
  location: string;
  path: string;
  site_id: string | number;
  root_site_id: string | number;
  node_type: number;
  status: "connected" | "disconnected";
};

export default function SiteDevicesPage() {
  const params = useParams();
  const router = useRouter();

  const siteId = params.siteId as string;

  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchDevices = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const res = await api.get(`/api/admin/sites/${siteId}/devices`);

      if (res.data.success) {
        setDevices(
          Array.isArray(res.data.data) ? res.data.data : []
        );
      } else {
        setDevices([]);
        setError("Unable to load devices.");
      }
   } catch (err: any) {
  console.error("Failed to fetch site devices:", {
    url: err.config?.baseURL + err.config?.url,
    status: err.response?.status,
    data: err.response?.data,
  });

  setError(
    err.response?.data?.message ||
    "Failed to load devices. Please try again."
  );
} finally {
  setLoading(false);
}
  }, [siteId]);

  useEffect(() => {
    if (siteId) {
      fetchDevices();
    }
  }, [siteId, fetchDevices]);

  const filteredDevices = devices.filter((device) => {
    const keyword = search.trim().toLowerCase();

    const matchesSearch =
      !keyword ||
      String(device.device_id).toLowerCase().includes(keyword) ||
      device.name?.toLowerCase().includes(keyword) ||
      device.type?.toLowerCase().includes(keyword) ||
      device.location?.toLowerCase().includes(keyword);

    const matchesStatus =
      statusFilter === "all" ||
      device.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const connectedCount = devices.filter(
    (device) => device.status === "connected"
  ).length;

  const disconnectedCount = devices.length - connectedCount;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white px-6 py-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <button
              type="button"
              onClick={() => router.push("/admin/sites")}
              className="mb-3 inline-flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-emerald-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Sites
            </button>

            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50">
                <Building2 className="h-6 w-6 text-emerald-700" />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Site Devices
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  All devices in this site and its sub-sites
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={fetchDevices}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>
      </div>

      <div className="space-y-6 px-6 py-6">
        {/* Summary cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Total Devices
                </p>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {devices.length}
                </p>
              </div>

              <div className="rounded-xl bg-blue-50 p-3">
                <Cpu className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Connected
                </p>
                <p className="mt-2 text-3xl font-bold text-emerald-600">
                  {connectedCount}
                </p>
              </div>

              <div className="rounded-xl bg-emerald-50 p-3">
                <Circle className="h-6 w-6 fill-emerald-500 text-emerald-500" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Disconnected
                </p>
                <p className="mt-2 text-3xl font-bold text-red-600">
                  {disconnectedCount}
                </p>
              </div>

              <div className="rounded-xl bg-red-50 p-3">
                <Circle className="h-6 w-6 fill-red-500 text-red-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Device list */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-200 p-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Device List
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {filteredDevices.length} of {devices.length} devices
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search devices..."
                  className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 sm:w-64"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
              >
                <option value="all">All statuses</option>
                <option value="connected">Connected</option>
                <option value="disconnected">Disconnected</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="text-center">
                <div className="inline-block h-10 w-10 animate-spin rounded-full border-b-2 border-emerald-600" />
                <p className="mt-3 text-sm text-slate-500">
                  Loading devices...
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <p className="text-sm text-red-600">{error}</p>
              <button
                type="button"
                onClick={fetchDevices}
                className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                Try Again
              </button>
            </div>
          ) : filteredDevices.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <Cable className="mx-auto h-12 w-12 text-slate-300" />
              <h3 className="mt-4 font-semibold text-slate-900">
                {devices.length === 0
                  ? "No devices found"
                  : "No matching devices"}
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                {devices.length === 0
                  ? "This site and its sub-sites do not have any devices."
                  : "Try changing your search or status filter."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px]">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Device
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Type
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Site Location
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Status
                    </th>
                  
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredDevices.map((device) => (
                    <tr
                      key={device.device_id}
                      onClick={() =>
                        router.push(
                          `/admin/devices/${device.device_id}`
                        )
                      }
                      className="cursor-pointer transition-colors hover:bg-emerald-50/60"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                            <Cpu className="h-5 w-5 text-slate-600" />
                          </div>

                          <div>
                            <p className="font-semibold text-slate-900">
                              {device.name}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              ID: {device.device_id}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span className="inline-flex rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                          {device.type || "Unknown"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex max-w-md items-start gap-2">
                          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                          <span className="text-sm text-slate-600">
                            {device.location || device.path || "—"}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        {device.status === "connected" ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                            <Circle className="h-2 w-2 fill-emerald-500 text-emerald-500" />
                            Connected
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
                            <Circle className="h-2 w-2 fill-red-500 text-red-500" />
                            Disconnected
                          </span>
                        )}
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

