"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
type DeviceType = {
  id: string;
  name: string;
};

type ProductLine = {
  product_line_id: string;
  name: string;
};

export default function AddDevicePage() {
  const router = useRouter();

  const [deviceTypes, setDeviceTypes] = useState<DeviceType[]>([]);
  const [productLines, setProductLines] = useState<ProductLine[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    device_name: "",
    serial_number: "",
    ip_address: "",
    model: "",
    device_type_id: "",
    product_line_id: "",
  });

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("adminToken")
      : null;

  /* ===== LOAD DEVICE TYPES ===== */
  useEffect(() => {
  const loadDeviceTypes = async () => {
    try {
      const { data } = await api.get("/api/admin/device-types");
      setDeviceTypes(data);
    } catch (err) {
      console.error("Load device types failed:", err);
    }
  };

  loadDeviceTypes();
}, []);
  /* ===== LOAD PRODUCT LINES ===== */
  const loadProductLines = async (deviceTypeId: string) => {
  try {
    const { data } = await api.get(
      `/api/admin/device-types/${deviceTypeId}/product-lines`
    );
    setProductLines(data);
  } catch (err) {
    console.error("Load product lines failed:", err);
  }
};
  /* ===== SAVE ===== */
 const saveDevice = async () => {
  setLoading(true);
  setError("");

  try {
    await api.post("/api/admin/devices", {
      ...form,
      ip_address: form.ip_address || null,
    });

    router.push("/admin/devices");
  } catch (err: any) {
    console.error("Create device failed:", err);

    setError(
      err.response?.data?.error || "Create failed"
    );
  } finally {
    setLoading(false);
  }
};
  return (
    <div className="p-6 max-w-lg">
      <h1 className="text-2xl font-bold mb-6">Add Device</h1>

      <div className="space-y-3">
        <input
          className="w-full p-2 border rounded"
          placeholder="Device name"
          value={form.device_name}
          onChange={(e) =>
            setForm({ ...form, device_name: e.target.value })
          }
        />

        <input
          className="w-full p-2 border rounded"
          placeholder="Serial number"
          value={form.serial_number}
          onChange={(e) =>
            setForm({ ...form, serial_number: e.target.value })
          }
        />

        <input
          className="w-full p-2 border rounded"
          placeholder="IP address"
          value={form.ip_address}
          onChange={(e) =>
            setForm({ ...form, ip_address: e.target.value })
          }
        />

        <input
          className="w-full p-2 border rounded"
          placeholder="Model"
          value={form.model}
          onChange={(e) =>
            setForm({ ...form, model: e.target.value })
          }
        />

        <select
          className="w-full p-2 border rounded"
          value={form.device_type_id}
          onChange={(e) => {
            setForm({
              ...form,
              device_type_id: e.target.value,
              product_line_id: "",
            });
            loadProductLines(e.target.value);
          }}
        >
          <option value="">-- Select device type --</option>
          {deviceTypes.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>

        <select
          className="w-full p-2 border rounded"
          disabled={!form.device_type_id}
          value={form.product_line_id}
          onChange={(e) =>
            setForm({ ...form, product_line_id: e.target.value })
          }
        >
          <option value="">-- Select product--</option>
          {productLines.map((p) => (
            <option key={p.product_line_id} value={p.product_line_id}>
              {p.name}
            </option>
          ))}
        </select>

        {error && <p className="text-red-500 text-xs">{error}</p>}
      </div>

      <div className="flex gap-2 mt-6">
        <button
          className="px-4 py-2 border rounded"
          onClick={() => router.back()}
        >
          Cancel
        </button>

        <button
          className="px-4 py-2 bg-black text-white rounded"
          onClick={saveDevice}
          disabled={loading}
        >
          {loading ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}
