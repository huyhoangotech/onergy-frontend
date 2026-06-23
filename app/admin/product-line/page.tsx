"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import {
  Plus,
  Loader,
  AlertCircle,
  Package,
  Link as LinkIcon
} from "lucide-react";
/* ================= TYPES ================= */
type DeviceType = {
  id: string;
  code: string;
  name: string;
};

type ProductLine = {
  product_line_id: string;
  device_type_id: string;
  device_type_name?: string;
  code: string;
  name: string;
  manufacturer?: string;
  description?: string;
};

/* ================= COMPONENT ================= */
export default function ProductPage() {
  const router = useRouter();
 useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      router.replace("/404");
    }
  }, [router]);
  const [productLines, setProductLines] = useState<ProductLine[]>([]);
  const [deviceTypes, setDeviceTypes] = useState<DeviceType[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* ===== add form ===== */
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    device_type_id: "",
    code: "",
    name: "",
    manufacturer: "",
    description: "",
  });

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("adminToken")
      : null;

  /* ================= LOAD DATA ================= */
  const loadProductLines = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/api/admin/product-lines");
    
      setProductLines(data);
    } catch {
      setError("Cannot load product lines");
    } finally {
      setLoading(false);
    }
  };

  const loadDeviceTypes = async () => {
    try {
      const { data } = await api.get("/api/admin/device-types");
      setDeviceTypes(data);
    } catch {
      console.error("Cannot load device types");
    }
  };

  useEffect(() => {
    loadProductLines();
    loadDeviceTypes();
  }, []);

  /* ================= ADD PRODUCT LINE ================= */
  const handleAdd = async () => {
    if (!form.device_type_id || !form.code || !form.name) {
      alert("Device type, code and name are required");
      return;
    }


      try {
    await api.post("/api/admin/product-lines", form);
      setShowAdd(false);
      setForm({
        device_type_id: "",
        code: "",
        name: "",
        manufacturer: "",
        description: "",
      });
      loadProductLines();
    } catch {
      alert("Add product line failed");
    }
  };

  /* ================= UI ================= */
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* HEADER */}
      <div className="border-b border-slate-200 bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-100 rounded-lg">
                <Package className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Product Lines</h1>
                <p className="text-sm text-slate-500">Quản lý sản phẩm và Modbus mapping</p>
              </div>
            </div>
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Product Line
            </button>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader className="w-6 h-6 text-blue-600 animate-spin" />
            </div>
          )}

          {error && (
            <div className="m-6 flex items-center gap-3 text-red-600 bg-red-50 p-4 rounded-lg">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {!loading && productLines.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Package className="w-12 h-12 text-slate-300 mb-4" />
              <p className="text-slate-600 font-medium">No product lines found</p>
              <p className="text-sm text-slate-500 mt-1">Create your first product line to get started</p>
            </div>
          )}

          {!loading && productLines.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold text-slate-700">Code</th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-700">Name</th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-700">Device Type</th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-700">Manufacturer</th>
                    <th className="px-6 py-3 text-center font-semibold text-slate-700">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {productLines.map((p) => (
                    <tr key={p.product_line_id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-slate-600">{p.code}</td>
                      <td className="px-6 py-4 font-medium text-slate-900">{p.name}</td>
                      <td className="px-6 py-4 text-slate-600">{p.device_type_name || "-"}</td>
                      <td className="px-6 py-4 text-slate-600">{p.manufacturer || "-"}</td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() =>
                            router.push(
                              `/admin/product-line/${p.product_line_id}/measurements`
                            )
                          }
                          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                        >
                          <LinkIcon className="w-4 h-4" />
                          Modbus Mapping
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

      {/* ================= ADD MODAL ================= */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6 shadow-lg">
            <h2 className="text-xl font-bold text-slate-900 mb-6">
              Add Product Line
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Device Type</label>
                <select
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
                  value={form.device_type_id}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      device_type_id: e.target.value,
                    })
                  }
                >
                  <option value="">-- Select Device Type --</option>
                  {deviceTypes.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Code</label>
                <input
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter product code"
                  value={form.code}
                  onChange={(e) =>
                    setForm({ ...form, code: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                <input
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter product name"
                  value={form.name}
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Manufacturer</label>
                <input
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter manufacturer name"
                  value={form.manufacturer}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      manufacturer: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Enter product description"
                  rows={3}
                  value={form.description}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      description: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowAdd(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
