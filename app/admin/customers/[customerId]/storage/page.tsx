"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import {
  ArrowLeft,
  Settings,
  Plus,
  Trash2,
  Loader,
  AlertCircle,
  HardDrive,
  CheckCircle2
} from "lucide-react";

/* ================= TYPES ================= */

type Measurement = {
  measurement_id: string;
  name: string;
  unit: string;
  parent_id?: string | null;
  enabled?: boolean;
  history_config_id?: string;
};

type DeviceStorage = {
  device_id: string;
  name: string;
  product_line_id?: string;
  product_line_name?: string;
  is_using_storage?: boolean;
  saved_measurements?: number;
};
type ProductLine = {
  product_line_id: string;
  product_line_name: string;
  device_count: number;
};
type Customer = {
  customer_id: string;
  name: string;
};

type StorageSummary = {
  devices_using_storage: number;
  saved_measurements: number;
   total_quota: number; 
  remaining_slots: number;
};

type MaxRow = {
  id: string;
  quantity: number;
  description: string;
};

/* ================= PAGE ================= */

export default function CustomerStoragePage() {
  const { customerId } = useParams<{ customerId: string }>();
  const router = useRouter();

  const [customer, setCustomer] = useState<Customer | null>(null);
const [devices, setDevices] = useState<DeviceStorage[]>([]);
const [selectedDevice, setSelectedDevice] = useState("");

const [productLines, setProductLines] = useState<ProductLine[]>([]);
const [selectedProductLine, setSelectedProductLine] = useState("");

const [configMode, setConfigMode] = useState<
  "device" | "product-line"
>("device");
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [originalMeasurements, setOriginalMeasurements] =
    useState<Measurement[]>([]);

  const [storageSummary, setStorageSummary] =
    useState<StorageSummary | null>(null);

  const [loading, setLoading] = useState(true);
  const [loadingMeasurements, setLoadingMeasurements] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  /* ================= MAX CONFIG ================= */

  const [openMaxModal, setOpenMaxModal] = useState(false);
  const [maxRows, setMaxRows] = useState<MaxRow[]>([]);
  const [savingMax, setSavingMax] = useState(false);

  const totalMax = useMemo(() => {
    return maxRows.reduce((sum, r) => sum + Number(r.quantity || 0), 0);
  }, [maxRows]);

  const loadSummary = async () => {
    const res = await api.get(
      `/api/admin/customers/${customerId}/storage-summary`
    );
    setStorageSummary(res.data);
  };
const loadProductLines = async () => {
  try {
    const res = await api.get(
      `/api/admin/customers/${customerId}/product-lines`
    );

    setProductLines(res.data?.data ?? []);
  } catch (err) {
    console.error("Failed to load product lines", err);
  }
};
  const loadMaxConfig = async () => {
    try {
      const res = await api.get(
        `/api/admin/customers/${customerId}/max-config`
      );

      const rows = res.data?.rows ?? [];

      setMaxRows(
        rows.map((r: any) => ({
          id: r.id,
          quantity: r.quantity,
          description: r.description,
        }))
      );
    } catch (err) {
      console.error("Failed to load max config", err);
    }
  };

  /* ================= LOAD CUSTOMER ================= */

  useEffect(() => {
    if (!customerId) return;

    const load = async () => {
      try {
        setLoading(true);

        const [customerRes, sitesRes] = await Promise.all([
          api.get(`/api/admin/customers/${customerId}`),
          api.get(`/api/admin/customers/${customerId}/sites`),
        ]);

        setCustomer(customerRes.data);

       await Promise.all([
  loadSummary(),
  loadMaxConfig(),
  loadProductLines(),
]);

        const sites = sitesRes.data?.data ?? [];

        const deviceResponses = await Promise.all(
          sites.map((site: any) =>
            api.get(`/api/admin/sites/${site.site_id}/devices`)
          )
        );

        const devicesFlattened = deviceResponses.flatMap(
          (res) => res.data?.data ?? []
        );

        const sortedDevices = devicesFlattened.sort(
          (a, b) =>
            Number(b.is_using_storage) - Number(a.is_using_storage) ||
            (b.saved_measurements ?? 0) -
              (a.saved_measurements ?? 0)
        );

        setDevices(sortedDevices);

        const firstActive =
          sortedDevices.find((d) => d.is_using_storage) ??
          sortedDevices[0];

        if (firstActive) {
          setSelectedDevice(firstActive.device_id);
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [customerId]);
  /* ================= LOAD MEASUREMENTS ================= */

  const reloadMeasurements = async () => {
    if (!selectedDevice) return;

    try {
      setLoadingMeasurements(true);

      const [measurementRes, historyRes] = await Promise.all([
        api.get(
          `/api/admin/devices/${selectedDevice}/measurements`
        ),
        api.get(
          `/api/admin/devices/${selectedDevice}/history-config`
        ),
      ]);

      const measurements: Measurement[] =
        measurementRes.data?.data ?? [];
      const history: any[] = historyRes.data?.data ?? [];

      const historyMap = new Map(
        history.map((h) => [h.measurement_id, h.id])
      );

      const merged = measurements.map((m) => ({
        ...m,
        enabled: historyMap.has(m.measurement_id),
        history_config_id: historyMap.get(
          m.measurement_id
        ),
      }));

      const sorted = [...merged].sort(
        (a, b) => Number(b.enabled) - Number(a.enabled)
      );

      setMeasurements(sorted);
      setOriginalMeasurements(sorted);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMeasurements(false);
    }
  };

 useEffect(() => {
  if (configMode === "device") {
    reloadMeasurements();
    return;
  }

  if (configMode === "product-line") {
    const firstDevice = devices.find(
      (d) =>
        d.product_line_id ===
        selectedProductLine
    );

    if (firstDevice) {
      setSelectedDevice(firstDevice.device_id);
    }
  }
}, [
  configMode,
  selectedProductLine,
  devices,
]);

  /* ================= TOGGLE ================= */

  const toggleMeasurement = (measurement_id: string) => {
  setMeasurements((prev) =>
    prev.map((m) =>
      m.measurement_id === measurement_id
        ? { ...m, enabled: !m.enabled }
        : m
    )
  );
};

  /* ================= SAVE ================= */

  const hasChanges = useMemo(() => {
    return measurements.some(
      (m, i) =>
        m.enabled !== originalMeasurements[i]?.enabled
    );
  }, [measurements, originalMeasurements]);

 const saveChanges = async () => {
  try {
    setSaving(true);

    // =========================
    // PRODUCT LINE
    // =========================

    if (configMode === "product-line") {
      const enabledMeasurements =
        measurements
          .filter((m) => m.enabled)
          .map((m) => m.measurement_id);

      if (!selectedProductLine) {
        alert("Please select a Product Line");
        return;
      }

      if (enabledMeasurements.length === 0) {
        alert("Please select at least one measurement");
        return;
      }

      await api.post(
        `/api/admin/history-config/product-line/${selectedProductLine}`,
        {
          measurement_ids: enabledMeasurements,
        }
      );

      await Promise.all([
        reloadMeasurements(),
        loadSummary(),
      ]);

      alert(
        "Configuration applied to Product Line successfully ✅"
      );

      return;
    }

    // =========================
    // SINGLE DEVICE
    // =========================

    const requests: Promise<any>[] = [];

    for (const m of measurements) {
      const original =
        originalMeasurements.find(
          (o) =>
            o.measurement_id ===
            m.measurement_id
        );

      if (!original) continue;

      if (!original.enabled && m.enabled) {
        requests.push(
          api.post(
            `/api/admin/history-config/${selectedDevice}`,
            {
              measurement_id:
                m.measurement_id,
            }
          )
        );
      }

      if (
        original.enabled &&
        !m.enabled &&
        m.history_config_id
      ) {
        requests.push(
          api.delete(
            `/api/admin/history-config/${m.history_config_id}`
          )
        );
      }
    }

    await Promise.all(requests);

    await Promise.all([
      reloadMeasurements(),
      loadSummary(),
    ]);

    alert(
      "Configuration saved successfully ✅"
    );
  } catch (err: any) {
    console.error(err);

    alert(
      err?.response?.data?.message ??
        "Failed to save configuration"
    );
  } finally {
    setSaving(false);
  }
};
const max = Number(storageSummary?.total_quota ?? 0);
const savedGlobal = storageSummary?.saved_measurements ?? 0;

const currentEnabled = measurements.filter((m) => m.enabled).length;

// Số measurement đang thêm mới (chưa save)
const originalEnabled = originalMeasurements.filter(
  (m) => m.enabled
).length;

const newlyAdded = currentEnabled - originalEnabled;

const isLimitReached =
  (storageSummary?.remaining_slots ?? 0) <= 0;

const deleteMaxRow = async (id: string) => {
  try {
    if (!confirm("Delete this row?")) return;

    // Nếu là row mới (chưa có trong DB)
    if (!id || id.length < 20) {
      // id dạng crypto.randomUUID() mới tạo ở frontend
      setMaxRows((prev) => prev.filter((r) => r.id !== id));
      return;
    }

    await api.delete(`/api/admin/storage-quota/${id}`);

    // Xoá khỏi state
    setMaxRows((prev) => prev.filter((r) => r.id !== id));

    await loadSummary(); // cập nhật total_quota
  } catch (err) {
    alert("Failed to delete row");
  }
};
  /* ================= UI ================= */

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-slate-600 font-medium">Loading configuration...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-4">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 pb-24">
      {/* HEADER */}
      <div className="border-b border-slate-200 bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                title="Go back"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </button>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-orange-100 rounded-lg">
                  <HardDrive className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">Storage Configuration</h1>
                  <p className="text-sm text-slate-500 mt-1">{customer?.name}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 px-4 py-2 bg-orange-50 border border-orange-200 rounded-lg">
              <HardDrive className="w-4 h-4 text-orange-600" />
              <span className="font-semibold text-orange-900">
                Max: {storageSummary?.total_quota ?? 0}
              </span>
              <button
                onClick={() => setOpenMaxModal(true)}
                className="ml-2 w-6 h-6 flex items-center justify-center rounded-full bg-orange-600 text-white text-xs font-bold hover:bg-orange-700 transition-colors"
                title="Configure max"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        {/* DEVICE SELECTOR */}
       {/* CONFIG MODE */}
<div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
  <div className="flex items-center justify-between mb-4">
    <div>
      <h2 className="text-lg font-bold text-slate-900">
        Configuration Scope
      </h2>

      <p className="text-sm text-slate-500 mt-1">
        Choose how you want to configure storage measurements
      </p>
    </div>
  </div>

  {/* MODE BUTTONS */}
  <div className="grid grid-cols-2 gap-3 mb-5">
    <button
      onClick={() => setConfigMode("device")}
      className={`p-4 rounded-lg border-2 text-left transition-all ${
        configMode === "device"
          ? "border-blue-500 bg-blue-50"
          : "border-slate-200 hover:border-blue-300"
      }`}
    >
      <div className="font-semibold text-slate-900">
        Single Device
      </div>

      <div className="text-xs text-slate-500 mt-1">
        Configure measurements for one device
      </div>
    </button>

    <button
      onClick={() => setConfigMode("product-line")}
      className={`p-4 rounded-lg border-2 text-left transition-all ${
        configMode === "product-line"
          ? "border-blue-500 bg-blue-50"
          : "border-slate-200 hover:border-blue-300"
      }`}
    >
      <div className="font-semibold text-slate-900">
        Product Line
      </div>

      <div className="text-xs text-slate-500 mt-1">
        Apply measurements to all devices
      </div>
    </button>
  </div>

  {/* DEVICE MODE */}
  {configMode === "device" && (
    <div>
      <label className="block text-sm font-bold text-slate-900 mb-3">
        Select Device
      </label>

      <select
        value={selectedDevice}
        onChange={(e) =>
          setSelectedDevice(e.target.value)
        }
        className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {devices.map((d) => (
          <option
            key={d.device_id}
            value={d.device_id}
          >
            {d.is_using_storage ? "● " : "○ "}
            {d.name}

            {d.product_line_name
              ? ` — ${d.product_line_name}`
              : ""}

            {d.saved_measurements
              ? ` (${d.saved_measurements})`
              : ""}
          </option>
        ))}
      </select>
    </div>
  )}

  {/* PRODUCT LINE MODE */}
  {configMode === "product-line" && (
    <div>
      <label className="block text-sm font-bold text-slate-900 mb-3">
        Select Product Line
      </label>

      <select
        value={selectedProductLine}
        onChange={(e) =>
          setSelectedProductLine(e.target.value)
        }
        className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">
          Select Product Line
        </option>

        {productLines.map((p) => (
          <option
            key={p.product_line_id}
            value={p.product_line_id}
          >
            {p.product_line_name}
            {` (${p.device_count} devices)`}
          </option>
        ))}
      </select>

      {selectedProductLine && (
        <div className="mt-3 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
          Measurements will be applied to{" "}
          <strong>
            {
              productLines.find(
                (p) =>
                  p.product_line_id ===
                  selectedProductLine
              )?.device_count
            }
          </strong>{" "}
          devices in this Product Line.
        </div>
      )}
    </div>
  )}
</div>

        {/* MEASUREMENTS */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Measurements to Save</h2>
          
          {loadingMeasurements ? (
            <div className="flex items-center justify-center py-8">
              <Loader className="w-5 h-5 text-blue-600 animate-spin" />
            </div>
          ) : measurements.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-600">No measurements available</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {measurements.map((m) => (
                <button
                  key={m.measurement_id}
                  onClick={() => {
                    if (!m.enabled && isLimitReached) return;
                    toggleMeasurement(m.measurement_id);
                  }}
                  className={`flex items-center gap-2 px-4 py-3 rounded-lg border-2 font-medium text-sm transition-all ${
                    m.enabled
                      ? "bg-blue-50 border-blue-400 text-blue-900"
                      : isLimitReached
                      ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-50"
                      : "bg-white border-slate-200 text-slate-700 hover:border-blue-400"
                  }`}
                >
                  <div className={`w-4 h-4 rounded border ${m.enabled ? "bg-blue-600 border-blue-600" : "bg-white border-slate-300"}`} />
                  <div className="text-left">
                    <div className="text-xs opacity-75">{m.name}</div>
                    <div className="text-xs font-mono">{m.unit}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {hasChanges && (
          <div className="flex justify-end">
            <button
              onClick={saveChanges}
              disabled={!hasChanges || saving}
              className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}
      </div>

      {/* BOTTOM STATS */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Saved</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{storageSummary?.saved_measurements ?? 0}</p>
            </div>
            <div className="text-center border-l border-r border-slate-200">
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Using</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{storageSummary?.devices_using_storage ?? 0}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Remaining</p>
              <p className={`text-2xl font-bold mt-1 ${(storageSummary?.remaining_slots ?? 0) > 0 ? "text-green-600" : "text-red-600"}`}>
                {storageSummary?.remaining_slots ?? 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {openMaxModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6 shadow-lg max-h-96 overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Configure Max Measurements</h2>

            <div className="space-y-3 mb-4">
              {maxRows.map((row) => (
                <div key={row.id} className="flex gap-2 items-start">
                  <input
                    type="number"
                    value={row.quantity}
                    onChange={(e) =>
                      setMaxRows((prev) =>
                        prev.map((r) =>
                          r.id === row.id
                            ? {
                                ...r,
                                quantity: Number(e.target.value),
                              }
                            : r
                        )
                      )
                    }
                    className="w-20 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Qty"
                  />

                  <input
                    type="text"
                    placeholder="Description"
                    value={row.description}
                    onChange={(e) =>
                      setMaxRows((prev) =>
                        prev.map((r) =>
                          r.id === row.id
                            ? {
                                ...r,
                                description: e.target.value,
                              }
                            : r
                        )
                      )
                    }
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />

                  <button
                    onClick={() => deleteMaxRow(row.id)}
                    className="p-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
              <button
                onClick={() =>
                  setMaxRows((prev) => [
                    ...prev,
                    {
                      id: crypto.randomUUID(),
                      quantity: 0,
                      description: "",
                    },
                  ])
                }
                className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Add Row
              </button>

              <div className="text-right">
                <p className="text-xs text-slate-500 font-medium">TOTAL</p>
                <p className="text-2xl font-bold text-slate-900">{totalMax}</p>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setOpenMaxModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>

              <button
                disabled={savingMax}
                onClick={async () => {
                  try {
                    if (
                      storageSummary &&
                      storageSummary.saved_measurements >
                        totalMax
                    ) {
                      alert(
                        "Saved measurements exceed max limit"
                      );
                      return;
                    }

                    setSavingMax(true);

                    await api.post(
                      `/api/admin/customers/${customerId}/max-config`,
                      { rows: maxRows }
                    );

                    await loadSummary();

                    setOpenMaxModal(false);
                    alert("Max configuration saved ✅");
                  } catch (err) {
                    alert(
                      "Failed to save max configuration"
                    );
                  } finally {
                    setSavingMax(false);
                  }
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {savingMax && <Loader className="w-4 h-4 animate-spin" />}
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
