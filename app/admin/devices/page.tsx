"use client";

import { Suspense } from "react";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { 
  Search, 
  Plus, 
  Settings, 
  Edit2, 
  Eye, 
  Trash2,
  Loader,
  ChevronRight
} from "lucide-react";

/* ================= TYPES ================= */
type Device = {
  id?: string;
  device_id?: string;
  device_name: string;
  serial_number: string;
  ip_address: string | null;
  model: string;
  status: "connected" | "disconnected";
  device_type_id: string;
  device_type_name: string;
  site_name?: string;
  product_line_id?: string;  
  product_line_name?: string; 
  slave_id: string;

};

type DeviceType = {
  id: string;
  name: string;
};
type ProductLine = {
  product_line_id: string;
  name: string;
};

/* ================= COMPONENT ================= */
function DeviceManagementPageContent() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [filtered, setFiltered] = useState<Device[]>([]);
  const [deviceTypes, setDeviceTypes] = useState<DeviceType[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [serialError, setSerialError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
const [productLines, setProductLines] = useState<ProductLine[]>([]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
const router = useRouter();
const searchParams = useSearchParams();
useEffect(() => {
  const statusFromUrl = searchParams.get("status");

  if (statusFromUrl === "connected" || statusFromUrl === "disconnected") {
    setStatusFilter(statusFromUrl);
  } else {
    setStatusFilter("");
  }
}, [searchParams]);

 useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      router.replace("/404");
    }
  }, [router]);
  const [form, setForm] = useState<any>({
    device_id: null,
    device_name: "",
    serial_number: "",
    ip_address: "",
    model: "",
    device_type_id: "",
     slave_id: "",
  });

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("adminToken")
      : null;

  /* ================= LOAD DEVICES ================= */
 
const loadDevices = async () => {
  setLoading(true);
  try {
    const { data } = await api.get("/api/admin/devices");

    console.log("RAW DEVICES FROM API:", data);

    const normalized: Device[] = data.map((d: any) => ({
      device_id: d.device_id,
      device_name: d.device_name || "",
      serial_number: d.serial_number || "",
      ip_address: d.ip_address || "",
      model: d.model || "",
      slave_id: d.slave_id || "",
      status: d.status || "disconnected",
      device_type_id: d.device_type_id || "",
      device_type_name: d.device_type_name || "",
      site_name: d.site_name || "",
      product_line_id: d.product_line_id || "",
      product_line_name: d.product_line_name || "",
    }));

    setDevices(normalized);
    setFiltered(normalized);
  } catch (err) {
    console.error("Error loading devices:", err);
    setError("Load devices failed");
  } finally {
    setLoading(false);
  }
};

  const loadDeviceTypes = async () => {
  try {
    const { data } = await api.get("/api/admin/device-types");
    setDeviceTypes(data);
  } catch (err) {
    console.error("Load device types failed:", err);
  }
};
  useEffect(() => {
    
    loadDevices();
    loadDeviceTypes();
  }, []);

  /* ================= FILTER ================= */
  useEffect(() => {
    let list = [...devices];

  if (search) {
  const keyword = search.toLowerCase();

  list = list.filter((d) =>
    d.device_name.toLowerCase().includes(keyword) ||
    d.serial_number.includes(search) ||
    d.site_name?.toLowerCase().includes(keyword) ||
    d.device_type_name?.toLowerCase().includes(keyword) 
  );
}

    if (statusFilter)
      list = list.filter((d) => d.status === statusFilter);

    setFiltered(list);
  }, [search, statusFilter, devices]);

  /* ================= SAVE ================= */
 const saveDevice = async () => {
  setError("");
  setSerialError("");

  if (showEditModal && !form.device_id) {
    setError("Device ID missing. Please reload page.");
    return;
  }

  const payload = {
    ...form,
    ip_address: form.ip_address || null,
  };

  try {
    if (showAddModal) {
      await api.post("/api/admin/devices", payload);
    } else {
      await api.put(
        `/api/admin/devices/${form.device_id}`,
        payload
      );
    }

    setShowAddModal(false);
    setShowEditModal(false);
    loadDevices();
  } catch (err: any) {
    // Axios error handling
    if (
      err.response?.status === 409 &&
      err.response?.data?.field === "serial_number"
    ) {
      setSerialError("Serial number already exists");
      return;
    }

    setError(
      err.response?.data?.error || "Save failed"
    );
  }
};


  /* ================= DELETE ================= */
  const handleDelete = async () => {
  if (!form.device_id) {
    setError("Device ID missing. Cannot delete.");
    return;
  }

  try {
    await api.delete(
      `/api/admin/devices/${form.device_id}`
    );
  } catch {
    setError("Delete failed");
  } finally {
    setShowDeleteModal(false);
    loadDevices();
  }
};

const loadProductLinesByDeviceType = async (deviceTypeId: string) => {
  try {
    const { data } = await api.get(
      `/api/admin/device-types/${deviceTypeId}/product-lines`
    );
    setProductLines(data);
  } catch (err) {
    console.error("Load product lines by device type failed", err);
    setProductLines([]);
  }
};


  /* ================= UI ================= */
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* HEADER */}
      <div className="border-b border-slate-200 bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Quản Lý Thiết Bị</h1>
              <p className="text-sm text-slate-500 mt-1">Tổng: {filtered.length} thiết bị</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => (window.location.href = "/admin/device-type")}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <Settings className="w-4 h-4" />
                Device Type
              </button>
              <button
                onClick={() => router.push("/admin/devices/add")}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Thêm Thiết Bị
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* FILTER SECTION */}
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Tìm kiếm theo tên, serial, hoặc site..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            value={statusFilter || ""}
            onChange={(e) => {
              const value = e.target.value;
              setStatusFilter(value);
              if (value) {
                router.push(`/admin/devices?status=${value}`);
              } else {
                router.push("/admin/devices");
              }
            }}
          >
            <option value="">All Status</option>
            <option value="connected">Connected</option>
            <option value="disconnected">Dissconnected</option>
          </select>
        </div>
      </div>

      {/* TABLE */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader className="w-6 h-6 text-blue-600 animate-spin" />
            </div>
          )}
          
          {!loading && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Search className="w-12 h-12 text-slate-300 mb-4" />
              <p className="text-slate-600 font-medium">Không tìm thấy thiết bị</p>
            </div>
          )}

          {!loading && filtered.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold text-slate-700">Tên Thiết Bị</th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-700">Serial</th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-700">Site</th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-700">Model</th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-700">Type</th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-700">Status</th>
                    <th className="px-6 py-3 text-center font-semibold text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filtered.map((d) => (
                    <tr key={d.device_id || d.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-900">{d.device_name}</td>
                      <td className="px-6 py-4 text-slate-600 text-xs font-mono">{d.serial_number}</td>
                      <td className="px-6 py-4 text-slate-600">{d.site_name || "-"}</td>
                      <td className="px-6 py-4 text-slate-600">{d.model || "-"}</td>
                      <td className="px-6 py-4 text-slate-600">{d.device_type_name || "-"}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          d.status === "connected"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}>
                          {d.status === "connected" ? "Connected" : "Dissconnected"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => router.push(`/admin/devices/${d.device_id || d.id}`)}
                            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Xem chi tiết"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={async () => {
                              const deviceForm = {
                                ...d,
                                device_id: d.device_id || d.id || null,
                                device_type_id: d.device_type_id || "",
                                product_line_id: d.product_line_id || "",
                              };
                              setForm(deviceForm);
                              setSerialError("");
                              if (deviceForm.device_type_id) {
                                await loadProductLinesByDeviceType(deviceForm.device_type_id);
                              }
                              setShowEditModal(true);
                            }}
                            className="p-1.5 text-slate-600 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors"
                            title="Chỉnh sửa"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setForm({
                                ...d,
                                device_id: d.device_id || d.id || null,
                              });
                              setShowDeleteModal(true);
                            }}
                            className="p-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Xóa"
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
        </div>
      </div>
    {/* ADD / EDIT MODAL */}
{(showAddModal || showEditModal) && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg w-full max-w-md p-6 shadow-lg">
      <h2 className="text-xl font-bold text-slate-900 mb-6">
        {showAddModal ? "Thêm Thiết Bị Mới" : "Chỉnh Sửa Thiết Bị"}
      </h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Tên thiết bị</label>
          <input
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Nhập tên thiết bị"
            value={form.device_name}
            onChange={(e) =>
              setForm({ ...form, device_name: e.target.value })
            }
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Serial number</label>
          <input
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Nhập serial number"
            value={form.serial_number}
            onChange={(e) =>
              setForm({ ...form, serial_number: e.target.value })
            }
          />
          {serialError && (
            <p className="text-red-600 text-xs mt-1">{serialError}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">IP Address</label>
            <input
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="x.x.x.x"
              value={form.ip_address || ""}
              onChange={(e) =>
                setForm({ ...form, ip_address: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Model</label>
            <input
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Model"
              value={form.model}
              onChange={(e) =>
                setForm({ ...form, model: e.target.value })
              }
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Slave ID</label>
          <input
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Slave ID"
            value={form.slave_id}
            onChange={(e) =>
              setForm({ ...form, slave_id: e.target.value })
            }
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Device Type</label>
          <select
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
            value={form.device_type_id}
            onChange={(e) =>
              setForm({ ...form, device_type_id: e.target.value })
            }
          >
            <option value="">-- Chọn loại thiết bị --</option>
            {deviceTypes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Product Line</label>
          <select
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer disabled:bg-slate-100 disabled:cursor-not-allowed"
            disabled={!form.device_type_id}
            value={form.product_line_id}
            onChange={(e) =>
              setForm({ ...form, product_line_id: e.target.value })
            }
          >
            <option value="">-- Chọn sản phẩm --</option>
            {productLines.map((p) => (
              <option
                key={p.product_line_id}
                value={p.product_line_id}
              >
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {error && <p className="text-red-600 text-xs bg-red-50 p-2 rounded">{error}</p>}
      </div>

      <div className="flex justify-end gap-3 mt-6">
        <button
          className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          onClick={() => {
            setShowAddModal(false);
            setShowEditModal(false);
          }}
        >
          Hủy
        </button>

        <button
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          onClick={saveDevice}
          disabled={loading}
        >
          {loading && <Loader className="w-4 h-4 animate-spin" />}
          {loading ? "Đang lưu..." : "Lưu"}
        </button>
      </div>
    </div>
  </div>
)}

{/* DELETE MODAL */}
{showDeleteModal && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg w-full max-w-sm p-6 shadow-lg">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
          <Trash2 className="w-6 h-6 text-red-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Xóa Thiết Bị</h2>
      </div>

      <p className="text-slate-600 text-sm mb-6">
        Bạn có chắc chắn muốn xóa thiết bị <span className="font-semibold text-slate-900">{form.device_name}</span>? Thao tác này không thể hoàn tác.
      </p>

      {error && <p className="text-red-600 text-xs bg-red-50 p-2 rounded mb-4">{error}</p>}

      <div className="flex justify-end gap-3">
        <button
          className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          onClick={() => setShowDeleteModal(false)}
        >
          Hủy
        </button>

        <button
          className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
          onClick={handleDelete}
        >
          <Trash2 className="w-4 h-4" />
          Xóa
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
}
export default function DeviceManagementPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DeviceManagementPageContent />
    </Suspense>
  );
}
