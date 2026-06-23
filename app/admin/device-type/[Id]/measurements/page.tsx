"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Loader,
  ChevronDown,
  AlertCircle
} from "lucide-react";

/* ================= TYPES ================= */
type Measurement = {
  measurement_id: string;
  code: string;
  name: string;
  unit?: string | null;
};

type DeviceType = {
  id: string;       // ✅ API TRẢ VỀ id
  code: string;
  name: string;
};
/* ================= PAGE ================= */
export default function DeviceTypeMeasurementsPage() {
  const params = useParams();
  const router = useRouter();

  // folder [Id] => param key là Id
  const id = params.Id as string;

  const [deviceTypeName, setDeviceTypeName] = useState("");

  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [allMeasurements, setAllMeasurements] = useState<Measurement[]>([]);
  const [selectedMeasurementId, setSelectedMeasurementId] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("adminToken")
      : null;

  /* ================= LOAD ================= */
const loadData = async () => {
  if (!id) return;

  setLoading(true);
  setError("");

  try {
    const [assignedRes, allRes, deviceTypesRes] = await Promise.all([
      api.get(`/api/admin/device-types/${id}/measurements`),
     api.get(`/api/admin/device-types/${id}/available-measurements`
),
      api.get<DeviceType[]>("/api/admin/device-types"),
    ]);

   const assignedData = assignedRes.data;
const deviceTypes = deviceTypesRes.data;

setMeasurements(assignedData);
setAllMeasurements(allRes.data);
    // ✅ FIX đúng như bạn đang dùng
    const currentType = deviceTypes.find(
      (d) => String(d.id) === String(id)
    );

    setDeviceTypeName(currentType?.name || "");
  } catch (err) {
    console.error(err);
    setError("Cannot load data");
  } finally {
    setLoading(false);
  }
};


  /* ================= ADD ================= */
  const addMeasurement = async () => {
  if (!selectedMeasurementId || !id) return;

  try {
    await api.post(
      `/api/admin/device-types/${id}/measurements`,
      {
        measurement_id: selectedMeasurementId,
      }
    );

    setSelectedMeasurementId("");
    loadData();
  } catch {
    setError("Cannot add measurement");
  }
};


  /* ================= REMOVE ================= */
 const removeMeasurement = async (measurementId: string) => {
  if (!id) return;

  try {
    await api.delete(
      `/api/admin/device-types/${id}/measurements/${measurementId}`
    );
    loadData();
  } catch {
    setError("Cannot remove measurement");
  }
};


  useEffect(() => {
    loadData();
  }, [id]);

  /* ================= RENDER ================= */
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* HEADER */}
      <div className="border-b border-slate-200 bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              title="Go back"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                {deviceTypeName || "Device Type Measurements"}
              </h1>
              <p className="text-sm text-slate-500 mt-1">Manage measurements for this device type</p>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* ADD SECTION */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 mb-8">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Add Measurement</h2>
          
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-2">Select Measurement</label>
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-left text-sm text-slate-900 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent flex items-center justify-between"
                >
                  <span>
                    {selectedMeasurementId
                      ? allMeasurements.find(
                          (m) => m.measurement_id === selectedMeasurementId
                        )?.name
                      : "-- Select measurement --"}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-slate-600 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
                </button>

                {dropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-300 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                    {allMeasurements
                      .sort((a, b) =>
                        a.code.localeCompare(b.code, undefined, {
                          sensitivity: "base",
                        })
                      )
                      .map((m) => (
                        <button
                          key={m.measurement_id}
                          onClick={() => {
                            setSelectedMeasurementId(m.measurement_id);
                            setDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-100 last:border-b-0 transition-colors"
                        >
                          <p className="font-medium text-slate-900">{m.name}</p>
                          <p className="text-xs text-slate-500 mt-0.5 font-mono">{m.code}</p>
                        </button>
                      ))}
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={addMeasurement}
              disabled={!selectedMeasurementId}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>

          {error && (
            <div className="mt-4 flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
        </div>

        {/* MEASUREMENTS TABLE */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader className="w-6 h-6 text-blue-600 animate-spin" />
            </div>
          )}

          {!loading && measurements.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="w-12 h-12 text-slate-300 mb-4" />
              <p className="text-slate-600 font-medium">No measurements assigned</p>
              <p className="text-sm text-slate-500 mt-1">Add measurements using the form above</p>
            </div>
          )}

          {!loading && measurements.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold text-slate-700">Code</th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-700">Name</th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-700">Unit</th>
                    <th className="px-6 py-3 text-center font-semibold text-slate-700">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {measurements.map((m) => (
                    <tr key={m.measurement_id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-slate-600">{m.code}</td>
                      <td className="px-6 py-4 font-medium text-slate-900">{m.name}</td>
                      <td className="px-6 py-4 text-slate-600">{m.unit || "-"}</td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => removeMeasurement(m.measurement_id)}
                          className="p-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Remove"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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
