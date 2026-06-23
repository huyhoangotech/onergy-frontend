"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import {
  Loader,
  AlertCircle,
  Smartphone,
  ArrowLeft,
} from "lucide-react";

type Device = {
  device_id: string;
  name: string;
  type: string;
  location: string;
  status: "connected" | "disconnected";
};

export default function CustomerDevicesPage() {
  const params = useParams();
  const router = useRouter();

 const customer_id = Array.isArray(params?.customerId)
  ? params.customerId[0]
  : params?.customerId;

  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

 const loadDevices = useCallback(async () => {
  if (!customer_id) {
    console.warn("⚠️ customer_id is undefined or empty");
    setError("Customer ID is missing");
    console.log("========== LOAD DEVICES END (STOP) ==========\n");
    return;
  }

  setLoading(true);
  setError("");

  try {
    const url = `/api/admin/customers/${customer_id}/devices`;


    const response = await api.get(url);

    const deviceList =
      response.data?.devices ||
      response.data?.data ||
      [];

    if (deviceList.length > 0) {
     
    } else {
      console.warn("⚠️ API success but empty device list");
    }

    setDevices(deviceList);
  } catch (err: any) {

    setError(
      err?.response?.data?.message ||
      err?.message ||
      "Cannot load devices"
    );
  } finally {
    setLoading(false);
  }
}, [customer_id, params]);

 useEffect(() => {
  loadDevices();
}, []);
  return (
    <div className="min-h-screen bg-slate-50">
      {/* HEADER */}
      <div className="bg-white border-b px-6 py-4 flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-slate-100 rounded"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <h1 className="text-xl font-bold">
          Devices of Customer
        </h1>
      </div>

      <div className="p-6">
        {/* LOADING */}
        {loading && (
          <div className="flex justify-center py-10">
            <Loader className="w-6 h-6 animate-spin" />
          </div>
        )}

        {/* ERROR */}
        {!loading && error && (
          <div className="text-red-600 flex gap-2 items-center">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {/* EMPTY */}
        {!loading && !error && devices.length === 0 && (
          <div className="text-center text-slate-500 py-10">
            No devices found
          </div>
        )}

        {/* TABLE */}
        {!loading && devices.length > 0 && (
          <div className="bg-white rounded shadow border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-100">
                <tr>
                  <th className="p-3 text-left">Name</th>
                  <th className="p-3 text-left">Type</th>
                  <th className="p-3 text-left">Location</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>

              <tbody>
                {devices.map((d) => (
                  <tr
                    key={d.device_id}
                    className="border-t hover:bg-slate-50"
                  >
                    <td className="p-3 flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-slate-400" />
                      {d.name}
                    </td>

                    <td className="p-3">
                      {d.type || "-"}
                    </td>

                    <td className="p-3">
                      {d.location || "-"}
                    </td>

                    <td className="p-3 text-center">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          d.status === "connected"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {d.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}