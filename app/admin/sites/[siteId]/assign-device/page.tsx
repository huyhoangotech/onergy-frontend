"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";

type Device = {
  device_id: string;
  name: string;
  serial_number: string;
  status: string;
  model: string;
};

export default function AssignDevicePage() {
  const { siteId } = useParams<{ siteId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();

  const nodeId = searchParams.get("nodeId");
  const nodeName = searchParams.get("nodeName");

  const [devices, setDevices] = useState<Device[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState("");

  /* ================= LOAD DEVICES ================= */
  const loadDevices = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/api/admin/devices/unassigned");
      setDevices(Array.isArray(data.data) ? data.data : []);
    } catch (err) {
      console.error(err);
      setError("Cannot load devices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDevices();
  }, []);

  /* ================= SELECT ================= */
  const toggleSelect = (deviceId: string) => {
    setSelected((prev) =>
      prev.includes(deviceId)
        ? prev.filter((id) => id !== deviceId)
        : [...prev, deviceId]
    );
  };

  /* ================= ASSIGN ================= */
  const handleAssign = async () => {
    if (!nodeId) {
      alert("Missing node");
      return;
    }

    if (selected.length === 0) {
      alert("Please select at least one device");
      return;
    }

    setAssigning(true);
    try {
     await api.post(`/api/admin/nodes/${nodeId}/devices/assign`, {
        device_ids: selected,
        node_id: nodeId, // 🔥 quan trọng
      });

      alert("Devices assigned successfully");
      router.push(`/admin/sites/${siteId}`);
    } catch (err) {
      console.error(err);
      alert("Assign devices failed");
    } finally {
      setAssigning(false);
    }
  };

  /* ================= UI ================= */
  return (
    <div className="p-6 text-black max-w-3xl">
      <h1 className="text-2xl font-bold mb-4">
        Assign Devices
      </h1>

      {/* 🔥 NODE INFO */}
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
        <p className="text-sm text-blue-700">
          Assigning to:
        </p>
        <p className="font-semibold text-blue-900">
          {nodeName || "Unknown node"}
        </p>
      </div>

      {loading && <p className="text-gray-500">Loading devices...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && devices.length === 0 && (
        <p className="text-gray-500">
          No unassigned devices available
        </p>
      )}

      {!loading && devices.length > 0 && (
        <div className="space-y-2">
          {devices.map((d) => (
            <div
              key={d.device_id}
              className={`p-3 border rounded flex justify-between items-center cursor-pointer transition ${
                selected.includes(d.device_id)
                  ? "bg-blue-100 border-blue-300"
                  : "bg-white hover:bg-slate-50"
              }`}
              onClick={() => toggleSelect(d.device_id)}
            >
              <div>
                <p className="font-medium">{d.name}</p>
                <p className="text-sm text-gray-600">
                  Serial: {d.serial_number} | Model: {d.model} | Status: {d.status}
                </p>
              </div>

              <input
                type="checkbox"
                checked={selected.includes(d.device_id)}
                onChange={() => toggleSelect(d.device_id)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          ))}
        </div>
      )}

      {/* ACTION */}
      <div className="mt-6 flex gap-2">
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          onClick={handleAssign}
          disabled={assigning || !nodeId}
        >
          {assigning
            ? "Assigning..."
            : `Assign (${selected.length})`}
        </button>

        <button
          className="px-4 py-2 border rounded hover:bg-gray-100"
          onClick={() => router.push(`/admin/sites/${siteId}`)}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}