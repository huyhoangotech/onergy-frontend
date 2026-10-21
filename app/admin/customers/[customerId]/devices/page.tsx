"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import {
ArrowLeft,
AlertCircle,
Building2,
Cpu,
Loader2,
MapPin,
RefreshCw,
Search,
Smartphone,
Wifi,
WifiOff,
} from "lucide-react";

type Device = {
device_id: string;
name: string;
type: string;
location: string;
status: "connected" | "disconnected";
};

type StatusFilter = "all" | "connected" | "disconnected";

export default function CustomerDevicesPage() {
const params = useParams();
const router = useRouter();

const customer_id = Array.isArray(params?.customerId)
? params.customerId[0]
: params?.customerId;

const [devices, setDevices] = useState<Device[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState("");
const [search, setSearch] = useState("");
const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

const loadDevices = useCallback(async () => {
if (!customer_id) {
setError("Customer ID is missing");
setLoading(false);
return;
}


setLoading(true);
setError("");

try {
  const response = await api.get(
    `/api/admin/customers/${customer_id}/devices`
  );

  const deviceList: Device[] =
    response.data?.devices ?? response.data?.data ?? [];

  setDevices(Array.isArray(deviceList) ? deviceList : []);
} catch (err: any) {
  setError(
    err?.response?.data?.message ||
      err?.message ||
      "Cannot load devices"
  );
} finally {
  setLoading(false);
}


}, [customer_id]);

useEffect(() => {
loadDevices();
}, [loadDevices]);

const connectedCount = useMemo(
() => devices.filter((d) => d.status === "connected").length,
[devices]
);

const disconnectedCount = devices.length - connectedCount;

const filteredDevices = useMemo(() => {
const keyword = search.trim().toLowerCase();


return devices.filter((device) => {
  const matchesSearch =
    !keyword ||
    [
      device.name,
      device.device_id,
      device.type,
      device.location,
    ].some((value) => value?.toLowerCase().includes(keyword));

  const matchesStatus =
    statusFilter === "all" || device.status === statusFilter;

  return matchesSearch && matchesStatus;
});


}, [devices, search, statusFilter]);

const statCards = [
{
label: "Total Devices",
value: devices.length,
icon: Smartphone,
iconStyle: "bg-blue-50 text-blue-600",
},
{
label: "Connected",
value: connectedCount,
icon: Wifi,
iconStyle: "bg-emerald-50 text-emerald-600",
},
{
label: "Disconnected",
value: disconnectedCount,
icon: WifiOff,
iconStyle: "bg-red-50 text-red-600",
},
];

return ( <div className="min-h-screen bg-slate-50">
{/* Header */} <div className="border-b border-slate-200 bg-white"> <div className="mx-auto flex max-w-screen-2xl items-center justify-between gap-4 px-6 py-5"> <div className="flex min-w-0 items-center gap-4">
<button
onClick={() => router.back()}
className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
title="Go back"
> <ArrowLeft className="h-5 w-5" /> </button>


        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
          <Building2 className="h-6 w-6 text-emerald-700" />
        </div>

        <div className="min-w-0">
          <h1 className="text-xl font-bold text-slate-900">
            Devices of Customer
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage and monitor devices assigned to this customer
          </p>
        </div>
      </div>

      <button
        onClick={loadDevices}
        disabled={loading}
        className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <RefreshCw
          className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
        />
        <span className="hidden sm:inline">Refresh</span>
      </button>
    </div>
  </div>

  <div className="mx-auto max-w-screen-2xl space-y-6 p-6">
    {/* Summary cards */}
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {statCards.map((stat) => {
        const Icon = stat.icon;

        return (
          <div
            key={stat.label}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  {stat.label}
                </p>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {stat.value}
                </p>
              </div>

              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.iconStyle}`}
              >
                <Icon className="h-6 w-6" />
              </div>
            </div>
          </div>
        );
      })}
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
          {/* Search */}
          <div className="relative min-w-0 sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search devices..."
              className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as StatusFilter)
            }
            className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          >
            <option value="all">All statuses</option>
            <option value="connected">Connected</option>
            <option value="disconnected">Disconnected</option>
          </select>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <p className="mt-3 text-sm text-slate-500">
            Loading devices...
          </p>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="flex flex-col items-center justify-center px-6 py-16">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <p className="mt-3 font-medium text-slate-900">
            Unable to load devices
          </p>
          <p className="mt-1 text-center text-sm text-slate-500">
            {error}
          </p>
          <button
            onClick={loadDevices}
            className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
          >
            Try again
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && devices.length === 0 && (
        <div className="flex flex-col items-center justify-center px-6 py-16">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
            <Smartphone className="h-7 w-7 text-slate-400" />
          </div>
          <p className="mt-4 font-semibold text-slate-900">
            No devices found
          </p>
          <p className="mt-1 text-sm text-slate-500">
            This customer does not have any assigned devices.
          </p>
        </div>
      )}

      {/* No search results */}
      {!loading && !error && devices.length > 0 && filteredDevices.length === 0 && (
        <div className="flex flex-col items-center justify-center px-6 py-14">
          <Search className="h-8 w-8 text-slate-300" />
          <p className="mt-3 font-medium text-slate-800">
            No matching devices
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Try changing your search or status filter.
          </p>
          <button
            onClick={() => {
              setSearch("");
              setStatusFilter("all");
            }}
            className="mt-3 text-sm font-medium text-emerald-700 hover:text-emerald-800"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Table */}
      {!loading && !error && filteredDevices.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-6 py-4 text-left font-semibold">
                  Device
                </th>
                <th className="px-6 py-4 text-left font-semibold">
                  Type
                </th>
                <th className="px-6 py-4 text-left font-semibold">
                  Location
                </th>
                <th className="px-6 py-4 text-center font-semibold">
                  Status
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredDevices.map((device) => (
                <tr
                  key={device.device_id}
                  onClick={() =>
                    router.push(`/admin/devices/${device.device_id}`)
                  }
                  className="cursor-pointer transition hover:bg-emerald-50/40"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                        <Smartphone className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900">
                          {device.name || "Unnamed device"}
                        </p>
                       
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-2 text-slate-600">
                      <Cpu className="h-4 w-4 text-slate-400" />
                      {device.type || "Unknown"}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-2 text-slate-600">
                      <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
                      <span className="max-w-sm truncate">
                        {device.location || "-"}
                      </span>
                    </span>
                  </td>

                  <td className="px-6 py-4 text-center">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                        device.status === "connected"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          device.status === "connected"
                            ? "bg-emerald-500"
                            : "bg-red-500"
                        }`}
                      />
                      {device.status === "connected"
                        ? "Connected"
                        : "Disconnected"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer */}
      {!loading && !error && devices.length > 0 && (
        <div className="flex flex-col gap-2 border-t border-slate-200 bg-slate-50 px-6 py-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>
            Showing {filteredDevices.length} of {devices.length} devices
          </span>
          <span>Click a device to view its details</span>
        </div>
      )}
    </div>
  </div>
</div>


);
}
