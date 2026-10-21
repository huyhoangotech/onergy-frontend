"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { ArrowLeft, Zap, Edit2, Trash2, Check, X } from "lucide-react";

type Device = {
  device_id: string;
  name: string;
  slave_id: number;
  status: number;
};

export default function GatewayDevicesPage() {
  const params = useParams();
  const gatewayId = Array.isArray(params.gatewayId)
    ? params.gatewayId[0]
    : params.gatewayId;
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editSlaveId, setEditSlaveId] = useState<number>(1);
  const [assignedDevices, setAssignedDevices] = useState<Device[]>([]);
  const [availableDevices, setAvailableDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(false);
const [assignDevice, setAssignDevice] = useState<Device | null>(null);
const [assignSlaveId, setAssignSlaveId] = useState("");
const [showAssignModal, setShowAssignModal] = useState(false);
  const loadData = async () => {
    setLoading(true);

    try {
      const [assignedRes, availableRes] = await Promise.all([
        api.get(`/api/admin/gateways/${gatewayId}/devices`),
        api.get(`/api/admin/devices/unassign`),
      ]);

      setAssignedDevices(
        Array.isArray(assignedRes.data) ? assignedRes.data : []
      );

      setAvailableDevices(
        Array.isArray(availableRes.data) ? availableRes.data : []
      );
    } catch (err) {
      console.error("Load data failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (gatewayId) loadData();
  }, [gatewayId]);

const handleAssign = async (device: Device) => {
  // Nếu chưa có slave id thì mở popup
  if (device.slave_id == null) {
    setAssignDevice(device);
    setAssignSlaveId("");
    setShowAssignModal(true);
    return;
  }

  try {
    await api.put(`/api/admin/devices/${device.device_id}/assign`, {
      gateway_id: gatewayId,
      slave_id: device.slave_id,
    });

    await loadData();
  } catch (err: any) {
    alert(err?.response?.data?.error || "Assign failed");
  }
};
const confirmAssign = async () => {
  if (!assignDevice) return;

  const slaveId = Number(assignSlaveId);

  if (!Number.isInteger(slaveId) || slaveId <= 0) {
    alert("Slave ID must be greater than 0");
    return;
  }

  const duplicated = assignedDevices.some(
    (d) => d.slave_id === slaveId
  );

  if (duplicated) {
    alert("Slave ID already exists");
    return;
  }

  try {
    await api.put(`/api/admin/devices/${assignDevice.device_id}/assign`, {
      gateway_id: gatewayId,
      slave_id: slaveId,
    });

    setShowAssignModal(false);
    setAssignDevice(null);
    setAssignSlaveId("");

    await loadData();
  } catch (err: any) {
    alert(err?.response?.data?.error || "Assign failed");
  }
};
  const handleUnassign = async (deviceId: string) => {
    try {
      await api.put(`/api/admin/devices/${deviceId}/unassign`);

      await loadData();
    } catch (err) {
      console.error("Unassign failed:", err);
    }
  };

  const handleSave = async (deviceId: string) => {
    try {
      const isDuplicate = assignedDevices.some(
        (d) =>
          d.device_id !== deviceId &&
          d.slave_id === editSlaveId
      );

      if (isDuplicate) {
        alert("Slave ID already exists!");
        return;
      }

      await api.put(`/api/admin/devices/${deviceId}`, {
        slave_id: editSlaveId,
      });

      setEditingId(null);
      await loadData();
    } catch (err: any) {
      alert(err?.response?.data?.error || "Update failed");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-cyan-100 rounded-lg">
              <Zap className="w-5 h-5 text-cyan-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Gateway Devices</h1>
          </div>
          <p className="text-sm text-slate-600 ml-11">Manage devices assigned to this gateway</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-slate-600">Loading devices...</div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Assigned Devices */}
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <div className="w-1 h-6 bg-cyan-600 rounded-full"></div>
                Assigned Devices
              </h2>

              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {assignedDevices.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">
                    No devices assigned yet
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-3 text-left font-semibold text-slate-900">Name</th>
                        <th className="px-6 py-3 text-left font-semibold text-slate-900">Slave ID</th>
                        <th className="px-6 py-3 text-left font-semibold text-slate-900">Status</th>
                        <th className="px-6 py-3 text-center font-semibold text-slate-900">Action</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-200">
                      {assignedDevices.map((d) => (
                        <tr key={d.device_id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 text-slate-900 font-medium">{d.name}</td>
                          <td className="px-6 py-4">
                            {editingId === d.device_id ? (
                              <input
                                type="number"
                                value={editSlaveId}
                                onChange={(e) => setEditSlaveId(Number(e.target.value))}
                                className="w-20 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                              />
                            ) : (
                              <span className="text-slate-700">{d.slave_id}</span>
                            )}
                          </td>

                          <td className="px-6 py-4">
                            {d.status === 1 ? (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                                Online
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                                Offline
                              </span>
                            )}
                          </td>

                          <td className="px-6 py-4 text-center">
                            {editingId === d.device_id ? (
                              <div className="flex gap-2 justify-center">
                                <button
                                  onClick={() => handleSave(d.device_id)}
                                  className="p-2 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
                                  title="Save"
                                >
                                  <Check className="w-4 h-4" />
                                </button>

                                <button
                                  onClick={() => setEditingId(null)}
                                  className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                                  title="Cancel"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                             <div className="flex gap-2 justify-center">
                                <button
                                  onClick={() => {
                                    setEditingId(d.device_id);
                                    setEditSlaveId(d.slave_id);
                                  }}
                                  className="p-2 rounded-lg bg-cyan-100 text-cyan-600 hover:bg-cyan-200 transition-colors"
                                  title="Edit"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>

                                <button
                                  onClick={() => handleUnassign(d.device_id)}
                                  className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                                  title="Remove"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Available Devices */}
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <div className="w-1 h-6 bg-amber-600 rounded-full"></div>
                Available Devices
              </h2>

              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {availableDevices.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">
                    No available devices
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-3 text-left font-semibold text-slate-900">Name</th>
                        <th className="px-6 py-3 text-left font-semibold text-slate-900">Slave ID</th>
                        <th className="px-6 py-3 text-center font-semibold text-slate-900">Action</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-200">
                      {availableDevices.map((d) => (
                        <tr key={d.device_id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 text-slate-900 font-medium">{d.name}</td>
                          <td className="px-6 py-4 text-slate-700">{d.slave_id}</td>

                          <td className="px-6 py-4 text-center">
                            <button
                             onClick={() => handleAssign(d)}
                              className="px-4 py-2 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 transition-colors"
                            >
                              Assign
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
            {showAssignModal && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div className="bg-white rounded-xl shadow-xl w-[420px]">
      <div className="px-6 py-4 border-b">
        <h2 className="text-lg font-semibold">
          Assign Device
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          This device does not have a Slave ID.
          Please enter one before assigning.
        </p>
      </div>

      <div className="p-6">
        <label className="block text-sm font-medium mb-2">
          Slave ID
        </label>

        <input
          type="number"
          min={1}
          value={assignSlaveId}
          onChange={(e) => setAssignSlaveId(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-cyan-500 outline-none"
          placeholder="Enter Slave ID"
        />
      </div>

      <div className="flex justify-end gap-3 px-6 py-4 border-t">
        <button
          onClick={() => {
            setShowAssignModal(false);
            setAssignDevice(null);
            setAssignSlaveId("");
          }}
          className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-100"
        >
          Cancel
        </button>

        <button
          onClick={confirmAssign}
          className="px-4 py-2 rounded-lg bg-cyan-600 text-white hover:bg-cyan-700"
        >
          Assign
        </button>
      </div>
    </div>
  </div>
)}
          </div>
        )}
      </div>
    </div>
  );
}
