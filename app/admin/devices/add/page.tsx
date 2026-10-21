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

type Gateway = {
  gateway_id: string;
  name: string;
};

export default function AddDevicePage() {
  const router = useRouter();

  const [deviceTypes, setDeviceTypes] = useState<DeviceType[]>([]);
  const [productLines, setProductLines] = useState<ProductLine[]>([]);
  const [gateways, setGateways] = useState<Gateway[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    device_name: "",
    serial_number: "",
    connection_type: "none", // gateway | ethernet | none
    gateway_id: "",
    slave_id: "",
    ip_address: "",
    port: "",
    model: "",
    device_type_id: "",
    product_line_id: "",
    active: "1", // string để bind select/input dễ hơn
  });

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

  /* ===== LOAD GATEWAYS ===== */
  useEffect(() => {
    const loadGateways = async () => {
      try {
        const { data } = await api.get("/api/admin/gateways");
        setGateways(data || []);
      } catch (err) {
        console.error("Load gateways failed:", err);
      }
    };

    loadGateways();
  }, []);

  /* ===== LOAD PRODUCT LINES ===== */
  const loadProductLines = async (deviceTypeId: string) => {
    try {
      const { data } = await api.get(
        `/api/admin/device-types/${deviceTypeId}/product-lines`
      );
      setProductLines(data || []);
    } catch (err) {
      console.error("Load product lines failed:", err);
    }
  };

  /* ===== CHANGE CONNECTION TYPE ===== */
  const handleConnectionTypeChange = (
    value: "gateway" | "ethernet" | "none"
  ) => {
    setForm((prev) => ({
      ...prev,
      connection_type: value,

      // reset field theo mode
      gateway_id: value === "gateway" ? prev.gateway_id : "",
      ip_address: value === "ethernet" ? prev.ip_address : "",
      port: value === "ethernet" ? prev.port : "",

      // slave_id:
      // - gateway: dùng
      // - ethernet: có thể dùng
      // - none: bỏ
      slave_id: value === "none" ? "" : prev.slave_id,
    }));
  };

  /* ===== VALIDATE FRONTEND ===== */
  const validateForm = () => {
    if (form.connection_type === "gateway") {
      if (!form.gateway_id) {
        return "Please select a gateway";
      }
    }

    if (form.connection_type === "ethernet") {
      if (!form.ip_address.trim()) {
        return "IP address is required for Ethernet";
      }
      if (!form.port.trim()) {
        return "Port is required for Ethernet";
      }
    }

    return "";
  };

  /* ===== SAVE ===== */
  const saveDevice = async () => {
    setLoading(true);
    setError("");

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      setLoading(false);
      return;
    }

    try {
      const payload: any = {
        device_name: form.device_name || null,
        serial_number: form.serial_number || null,
        model: form.model || null,
        device_type_id: form.device_type_id || null,
        product_line_id: form.product_line_id || null,
        connection_type: form.connection_type,
        active: Number(form.active),
      };

      if (form.connection_type === "gateway") {
        payload.gateway_id = form.gateway_id || null;
        payload.slave_id =
          form.slave_id !== "" ? Number(form.slave_id) : null;
      }

      if (form.connection_type === "ethernet") {
        payload.ip_address = form.ip_address || null;
        payload.port = form.port !== "" ? Number(form.port) : null;
        payload.slave_id =
          form.slave_id !== "" ? Number(form.slave_id) : null;
      }

      // none => không gửi gateway/ip/port/slave
      await api.post("/api/admin/devices", payload);

      router.push("/admin/devices");
    } catch (err: any) {
      console.error("Create device failed:", err);
      setError(err.response?.data?.error || "Create failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-lg">
      <h1 className="text-2xl font-bold mb-6">Add Device</h1>

      <div className="space-y-3">
        {/* Device name */}
        <input
          className="w-full p-2 border rounded"
          placeholder="Device name"
          value={form.device_name}
          onChange={(e) =>
            setForm({ ...form, device_name: e.target.value })
          }
        />

        {/* Serial */}
        <input
          className="w-full p-2 border rounded"
          placeholder="Serial number"
          value={form.serial_number}
          onChange={(e) =>
            setForm({ ...form, serial_number: e.target.value })
          }
        />

        {/* ===== CONNECTION TYPE ===== */}
        <select
          className="w-full p-2 border rounded"
          value={form.connection_type}
          onChange={(e) =>
            handleConnectionTypeChange(
              e.target.value as "gateway" | "ethernet" | "none"
            )
          }
        >
          <option value="none">None</option>
          <option value="gateway">Gateway</option>
          <option value="ethernet">Ethernet</option>
        </select>

        {/* ===== GATEWAY MODE ===== */}
        {form.connection_type === "gateway" && (
          <>
            <select
              className="w-full p-2 border rounded"
              value={form.gateway_id}
              onChange={(e) =>
                setForm({ ...form, gateway_id: e.target.value })
              }
            >
              <option value="">-- Select gateway --</option>
              {gateways.map((g) => (
                <option key={g.gateway_id} value={g.gateway_id}>
                  {g.name}
                </option>
              ))}
            </select>

            <input
              className="w-full p-2 border rounded"
              placeholder="Slave ID"
              value={form.slave_id}
              onChange={(e) =>
                setForm({ ...form, slave_id: e.target.value })
              }
            />
          </>
        )}

        {/* ===== ETHERNET MODE ===== */}
        {form.connection_type === "ethernet" && (
          <>
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
              placeholder="Port"
              type="number"
              value={form.port}
              onChange={(e) =>
                setForm({ ...form, port: e.target.value })
              }
            />

            <input
              className="w-full p-2 border rounded"
              placeholder="Slave ID / Unit ID (optional)"
              value={form.slave_id}
              onChange={(e) =>
                setForm({ ...form, slave_id: e.target.value })
              }
            />
          </>
        )}

        {/* ===== ACTIVE ===== */}
        <select
          className="w-full p-2 border rounded"
          value={form.active}
          onChange={(e) =>
            setForm({ ...form, active: e.target.value })
          }
        >
          <option value="1">Active</option>
          <option value="0">Inactive</option>
        </select>

        {/* Model */}
        <input
          className="w-full p-2 border rounded"
          placeholder="Model"
          value={form.model}
          onChange={(e) =>
            setForm({ ...form, model: e.target.value })
          }
        />

        {/* Device type */}
        <select
          className="w-full p-2 border rounded"
          value={form.device_type_id}
          onChange={(e) => {
            const deviceTypeId = e.target.value;
            setForm((prev) => ({
              ...prev,
              device_type_id: deviceTypeId,
              product_line_id: "",
            }));

            if (deviceTypeId) {
              loadProductLines(deviceTypeId);
            } else {
              setProductLines([]);
            }
          }}
        >
          <option value="">-- Select device type --</option>
          {deviceTypes.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>

        {/* Product line */}
        <select
          className="w-full p-2 border rounded"
          disabled={!form.device_type_id}
          value={form.product_line_id}
          onChange={(e) =>
            setForm({ ...form, product_line_id: e.target.value })
          }
        >
          <option value="">-- Select product --</option>
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
          className="px-4 py-2 bg-black text-white rounded disabled:opacity-50"
          onClick={saveDevice}
          disabled={loading}
        >
          {loading ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}