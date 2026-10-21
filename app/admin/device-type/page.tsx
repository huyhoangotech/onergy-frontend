"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import {
  ChevronRight,
  Plus,
  Edit2,
  Trash2,
  Loader,
  Settings,
  ArrowLeft
} from "lucide-react";

/* ================= TYPES ================= */
type DeviceType = {
  id: string;
  code: string;
  name: string;
  description: string;
};

type ProductLine = {
  product_line_id: string;
  code: string;
  name: string;
  manufacturer: string;
};

type Measurement = {
  measurement_id: string;
  code: string;
  name: string;
  unit?: string | null;
};

/* ================= COMPONENT ================= */
export default function DeviceTypeManagementPage() {
  const router = useRouter();

  /* ================= AUTH GUARD ================= */
  const [mounted, setMounted] = useState(false);
  const [token, setToken] = useState<string | null>(null);
 
  /* ================= STATE ================= */
  const [deviceTypes, setDeviceTypes] = useState<DeviceType[]>([]);
  const [selectedType, setSelectedType] = useState<DeviceType | null>(null);

  const [activeTab, setActiveTab] = useState<"product" | "measurement">("product");

  const [productLines, setProductLines] = useState<ProductLine[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [loadingMeasurements, setLoadingMeasurements] = useState(false);

  const [loadingTypes, setLoadingTypes] = useState(false);
  const [error, setError] = useState("");

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductLine | null>(null);

  const [form, setForm] = useState({
    code: "",
    name: "",
    description: "",
    manufacturer: "",
    protocol: "",
  });
    useEffect(() => {
    setMounted(true);
    const t = localStorage.getItem("adminToken");
    if (!t) {
      router.replace("/404");
    } else {
      setToken(t);
    }
  }, [router]);
  /* ================= LOAD DEVICE TYPES ================= */
  const loadDeviceTypes = async () => {
    setLoadingTypes(true);
    try {
    const { data } = await api.get("/api/admin/device-types" 
        
      );
      
      if (!Array.isArray(data)) {
        setDeviceTypes([]);
        return;
      }
      setDeviceTypes(data);
    } catch {
      setError("Cannot load device types");
    } finally {
      setLoadingTypes(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    loadDeviceTypes();
  }, [token]);

  /* ================= LOAD PRODUCT LINES ================= */
  const loadProductLines = async (type: DeviceType) => {
    setSelectedType(type);
    setActiveTab("product");
    setLoadingProducts(true);
    setProductLines([]);

    try {
       const { data } = await api.get(
        `api/admin/device-types/${type.id}/product-lines`
        
      );
     
      setProductLines(data);
    } catch {
      setError("Cannot load product lines");
    } finally {
      setLoadingProducts(false);
    }
  };

  /* ================= ADD / UPDATE PRODUCT LINE ================= */
 const saveProductLine = async () => {
  if (!selectedType) return;

  try {
    if (editingProduct) {
      await api.put(
        `/api/admin/product-lines/${editingProduct.product_line_id}`,
        {
          ...form,
          device_type_id: selectedType.id,
        }
      );
    } else {
      await api.post("/api/admin/product-lines", {
        ...form,
        device_type_id: selectedType.id,
      });
    }

    setShowAddModal(false);
    setEditingProduct(null);
    setForm({
      code: "",
      name: "",
      description: "",
      manufacturer: "",
      protocol: "",
    });

    loadProductLines(selectedType);
  } catch {
    alert("Save failed");
  }
};
  /* ================= DELETE PRODUCT LINE ================= */
 const handleDeleteProductLine = async (id: string) => {
  if (!confirm("Delete this product line?")) return;

  try {
    await api.delete(`/api/admin/product-lines/${id}`);

    if (selectedType) loadProductLines(selectedType);
  } catch {
    alert("Delete failed");
  }
};
  useEffect(() => {
  if (!token) return;
  loadDeviceTypes();
}, [token]);
if (!token) {
  return null;
}
  /* ================= RENDER ================= */
  if (!token) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* HEADER */}
      <div className="border-b border-slate-200 bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-5 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-slate-900">Device Type Configuration</h1>
          <p className="text-sm text-slate-500 mt-1">Manage device types and product lines</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* ================= LEFT: DEVICE TYPES LIST ================= */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm h-fit">
              <div className="px-6 py-4 border-b border-slate-200">
                <h2 className="text-lg font-bold text-slate-900">Device Types</h2>
              </div>

              <div className="divide-y divide-slate-200">
                {loadingTypes && (
                  <div className="p-6 flex items-center justify-center">
                    <Loader className="w-5 h-5 text-blue-600 animate-spin" />
                  </div>
                )}

                {!loadingTypes && deviceTypes.length === 0 && (
                  <div className="p-6 text-center text-slate-500 text-sm">
                    No device types found
                  </div>
                )}

                {!loadingTypes && deviceTypes.map((dt) => (
                  <button
                    key={dt.id}
                    onClick={() => loadProductLines(dt)}
                    className={`w-full text-left px-6 py-4 transition-colors flex items-center justify-between group ${
                      selectedType?.id === dt.id
                        ? "bg-blue-50 border-l-4 border-blue-600"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <div>
                      <p className={`font-medium ${selectedType?.id === dt.id ? "text-blue-600" : "text-slate-900"}`}>
                        {dt.name}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">{dt.code}</p>
                    </div>
                    {selectedType?.id === dt.id && (
                      <ChevronRight className="w-5 h-5 text-blue-600" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ================= RIGHT: PRODUCT LINES CONTENT ================= */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
              {/* TABS */}
              <div className="border-b border-slate-200 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex gap-1">
                    <button
                      onClick={() => setActiveTab("product")}
                      className={`px-4 py-2 font-medium text-sm transition-colors ${
                        activeTab === "product"
                          ? "text-blue-600 border-b-2 border-blue-600"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Product Lines
                    </button>

                    <button
                      disabled={!selectedType}
                      onClick={() =>
                        selectedType &&
                        router.push(`/admin/device-type/${selectedType.id}/measurements`)
                      }
                      className={`px-4 py-2 font-medium text-sm transition-colors ${
                        !selectedType
                          ? "text-slate-300 cursor-not-allowed"
                          : activeTab === "measurement"
                          ? "text-blue-600 border-b-2 border-blue-600"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Measurements
                    </button>
                  </div>

                  {selectedType && activeTab === "product" && (
                    <button
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                      onClick={() => {
                        setEditingProduct(null);
                        setShowAddModal(true);
                      }}
                    >
                      <Plus className="w-4 h-4" />
                      Add Product Line
                    </button>
                  )}
                </div>
              </div>

              {/* CONTENT */}
              <div className="p-6">
                {!selectedType ? (
                  <div className="text-center py-12">
                    <Settings className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-600 font-medium">Select a device type to continue</p>
                  </div>
                ) : (
                  <>
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-slate-900">
                        {selectedType.name}
                      </h3>
                      {selectedType.description && (
                        <p className="text-sm text-slate-600 mt-1">{selectedType.description}</p>
                      )}
                    </div>

                    {loadingProducts && (
                      <div className="flex items-center justify-center py-8">
                        <Loader className="w-5 h-5 text-blue-600 animate-spin" />
                      </div>
                    )}

                    {!loadingProducts && productLines.length === 0 && (
                      <div className="text-center py-8">
                        <p className="text-slate-600">No product lines added yet</p>
                      </div>
                    )}

                    {!loadingProducts && productLines.length > 0 && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                              <th className="px-6 py-3 text-left font-semibold text-slate-700">Code</th>
                              <th className="px-6 py-3 text-left font-semibold text-slate-700">Name</th>
                              <th className="px-6 py-3 text-left font-semibold text-slate-700">Manufacturer</th>
                              <th className="px-6 py-3 text-center font-semibold text-slate-700">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {productLines.map((p) => (
                              <tr key={p.product_line_id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 font-mono text-xs text-slate-600">{p.code}</td>
                                <td className="px-6 py-4 font-medium text-slate-900">{p.name}</td>
                                <td className="px-6 py-4 text-slate-600">{p.manufacturer || "-"}</td>
                                <td className="px-6 py-4 text-center">
                                  <div className="flex items-center justify-center gap-2">
                                    <button
                                      className="p-1.5 text-slate-600 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors"
                                      onClick={() => {
                                        setEditingProduct(p);
                                        setForm({
                                          code: p.code,
                                          name: p.name,
                                          description: "",
                                          manufacturer: p.manufacturer || "",
                                          protocol: "",
                                        });
                                        setShowAddModal(true);
                                      }}
                                      title="Edit"
                                    >
                                      <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                      className="p-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                      onClick={() => handleDeleteProductLine(p.product_line_id)}
                                      title="Delete"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================= ADD / EDIT MODAL ================= */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6 shadow-lg">
            <h2 className="text-xl font-bold text-slate-900 mb-6">
              {editingProduct ? "Edit Product Line" : "Add Product Line"}
            </h2>

            <div className="space-y-4">
              {["code", "name", "manufacturer", "protocol"].map((f) => (
                <div key={f}>
                  <label className="block text-sm font-medium text-slate-700 mb-1 capitalize">
                    {f}
                  </label>
                  <input
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={`Enter ${f}`}
                    value={(form as any)[f]}
                    onChange={(e) =>
                      setForm({ ...form, [f]: e.target.value })
                    }
                  />
                </div>
              ))}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Enter description"
                  rows={3}
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveProductLine}
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
