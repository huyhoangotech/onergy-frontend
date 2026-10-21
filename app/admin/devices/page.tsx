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
  active?: number;
  connection_type?: "none" | "gateway" | "ethernet" | null;
  gateway_id?: string | null;
  port?: number | null;
};

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

/* ================= COMPONENT ================= */
function DeviceManagementPageContent() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [filtered, setFiltered] = useState<Device[]>([]);
  const [deviceTypes, setDeviceTypes] = useState<DeviceType[]>([]);
  const [productLines, setProductLines] = useState<ProductLine[]>([]);
  const [gateways, setGateways] = useState<Gateway[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [serialError, setSerialError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginatedDevices = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

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
    active: 1,
    connection_type: "none",
    gateway_id: "",
    port: "",
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
        active: d.active ?? 1,
        connection_type: d.connection_type || "none",
        gateway_id: d.gateway_id || "",
        port: d.port || null,
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

  const loadGateways = async () => {
    try {
      const { data } = await api.get("/api/admin/gateways");
      setGateways(data || []);
    } catch (err) {
      console.error("Load gateways failed:", err);
    }
  };

  useEffect(() => {
    loadDevices();
    loadDeviceTypes();
    loadGateways();
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
    setCurrentPage(1);
  }, [search, statusFilter, devices]);

  /* ================= HANDLE CONNECTION TYPE CHANGE ================= */
  const handleConnectionTypeChange = (
    value: "none" | "gateway" | "ethernet"
  ) => {
    setForm((prev: any) => ({
      ...prev,
      connection_type: value,

      gateway_id: value === "gateway" ? prev.gateway_id : "",
      ip_address: value === "ethernet" ? prev.ip_address : "",
      port: value === "ethernet" ? prev.port : "",
      slave_id:
        value === "gateway" || value === "ethernet" ? prev.slave_id : "",
    }));
  };

  /* ================= SAVE ================= */
  const saveDevice = async () => {
    setError("");
    setSerialError("");

    if (showEditModal && !form.device_id) {
      setError("Device ID missing. Please reload page.");
      return;
    }

    const payload: any = {
      device_name: form.device_name || null,
      serial_number: form.serial_number || null,
      model: form.model || null,
      device_type_id: form.device_type_id || null,
      product_line_id: form.product_line_id || null,
      connection_type: form.connection_type || "none",
      active: Number(form.active ?? 1),
    };

    if (form.connection_type === "gateway") {
      payload.gateway_id = form.gateway_id || null;
      payload.slave_id = form.slave_id !== "" ? Number(form.slave_id) : null;
      payload.ip_address = null;
      payload.port = null;
    } else if (form.connection_type === "ethernet") {
      payload.ip_address = form.ip_address || null;
      payload.port = form.port !== "" ? Number(form.port) : null;
      payload.slave_id = form.slave_id !== "" ? Number(form.slave_id) : null;
      payload.gateway_id = null;
    } else {
      payload.gateway_id = null;
      payload.ip_address = null;
      payload.port = null;
      payload.slave_id = null;
    }

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
    <div className="min-h-screen bg-[#f7f9fc] text-slate-950">
      {/* HEADER */}
      <div className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 shadow-[0_1px_10px_rgba(15,23,42,0.04)] backdrop-blur">
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
                onClick={() => {
                  setForm({
                    device_id: null,
                    device_name: "",
                    serial_number: "",
                    ip_address: "",
                    model: "",
                    device_type_id: "",
                    slave_id: "",
                    active: 1,
                    connection_type: "none",
                    gateway_id: "",
                    port: "",
                  });
                  setError("");
                  setSerialError("");
                  setProductLines([]);
                  setShowEditModal(false);
                  setShowAddModal(true);
                }}
                className="flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white shadow-[0_6px_16px_rgba(15,23,42,0.22)] transition-all hover:-translate-y-0.5 hover:bg-slate-900 hover:shadow-[0_8px_20px_rgba(15,23,42,0.28)]"
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
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
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
            <option value="disconnected">Disconnected</option>
          </select>
        </div>
      </div>

      {/* TABLE */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.05)]">
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
                    <th className="px-6 py-3 text-left font-semibold text-slate-700">Protocol</th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-700">Active</th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-700">Status</th>
                    <th className="px-6 py-3 text-center font-semibold text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {paginatedDevices.map((d) => (
                    <tr key={d.device_id || d.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-900">{d.device_name}</td>
                      <td className="px-6 py-4 text-slate-600 text-xs font-mono">{d.serial_number}</td>
                      <td className="px-6 py-4 text-slate-600">{d.site_name || "-"}</td>
                      <td className="px-6 py-4 text-slate-600">{d.model || "-"}</td>
                      <td className="px-6 py-4 text-slate-600">{d.device_type_name || "-"}</td>
                      <td className="px-6 py-4 text-slate-600">{d.connection_type || "none"}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          Number(d.active ?? 1) === 1
                            ? "bg-green-100 text-green-800"
                            : "bg-slate-200 text-slate-700"
                        }`}>
                          {Number(d.active ?? 1) === 1 ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          d.status === "connected"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}>
                          {d.status === "connected" ? "Connected" : "Disconnected"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
<div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            aria-label={`Xem chi tiết ${d.device_name}`}
                            onClick={() => router.push(`/admin/devices/${d.device_id || d.id}`)}
                            className="flex size-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-[0_3px_8px_rgba(15,23,42,0.12)] transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950 hover:shadow-[0_5px_12px_rgba(15,23,42,0.18)]"
                            title="Xem chi tiết"
                          >
                            <Eye className="size-4" />
                          </button>
                          <button
                            onClick={async () => {
                              const deviceForm = {
                                device_id: d.device_id || d.id || null,
                                device_name: d.device_name || "",
                                serial_number: d.serial_number || "",
                                ip_address: d.ip_address || "",
                                model: d.model || "",
                                device_type_id: d.device_type_id || "",
                                slave_id: d.slave_id || "",
                                product_line_id: d.product_line_id || "",
                                active: d.active ?? 1,
                                connection_type: (d.connection_type as "none" | "gateway" | "ethernet") || "none",
                                gateway_id: d.gateway_id || "",
                                port:
                                  d.port !== null && d.port !== undefined
                                    ? String(d.port)
                                    : "",
                              };
                              setForm(deviceForm);
                              setSerialError("");
                              if (deviceForm.device_type_id) {
                                await loadProductLinesByDeviceType(deviceForm.device_type_id);
                              }
                              setShowEditModal(true);
                            }}
type="button"
                            aria-label={`Chỉnh sửa ${d.device_name}`}
                            className="flex size-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-[0_3px_8px_rgba(15,23,42,0.12)] transition-all hover:-translate-y-0.5 hover:border-amber-200 hover:bg-amber-50 hover:text-amber-700 hover:shadow-[0_5px_12px_rgba(15,23,42,0.18)]"
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
type="button"
                            aria-label={`Xóa ${d.device_name}`}
                            className="flex size-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-[0_3px_8px_rgba(15,23,42,0.12)] transition-all hover:-translate-y-0.5 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 hover:shadow-[0_5px_12px_rgba(15,23,42,0.18)]"
                            title="Xóa"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && filtered.length > 0 && (
            <div className="flex flex-col gap-3 border-t border-slate-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">
                Hiển thị <span className="font-semibold text-slate-700">{(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, filtered.length)}</span> trên <span className="font-semibold text-slate-700">{filtered.length}</span> thiết bị
              </p>
              <div className="flex items-center gap-2" aria-label="Phân trang">
                <button
                  type="button"
                  aria-label="Trang trước"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  className="flex size-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  ‹
                </button>
                {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                  <button
                    key={page}
                    type="button"
                    aria-label={`Trang ${page}`}
                    aria-current={currentPage === page ? "page" : undefined}
                    onClick={() => setCurrentPage(page)}
                    className={`flex size-9 items-center justify-center rounded-lg border text-sm font-medium transition ${
                      currentPage === page
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  type="button"
                  aria-label="Trang sau"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                  className="flex size-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  ›
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ADD / EDIT MODAL */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6 shadow-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-900 mb-6">
              {showAddModal ? "Thêm Thiết Bị Mới" : "Chỉnh Sửa Thiết Bị"}
            </h2>
            
            <div className="space-y-4">
              {/* DEVICE NAME */}
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

              {/* SERIAL */}
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

              {/* MODEL */}
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

              {/* ACTIVE */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Trạng thái hoạt động</label>
                <select
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
                  value={String(form.active ?? 1)}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      active: Number(e.target.value),
                    })
                  }
                >
                  <option value="1">Active</option>
                  <option value="0">Inactive</option>
                </select>
              </div>

              {/* CONNECTION TYPE */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Kiểu kết nối</label>
                <select
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
                  value={form.connection_type || "none"}
                  onChange={(e) =>
                    handleConnectionTypeChange(
                      e.target.value as "none" | "gateway" | "ethernet"
                    )
                  }
                >
                  <option value="none">None</option>
                  <option value="gateway">Gateway</option>
                  <option value="ethernet">Ethernet</option>
                </select>
              </div>

              {/* GATEWAY MODE */}
              {form.connection_type === "gateway" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Gateway</label>
                    <select
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
                      value={form.gateway_id || ""}
                      onChange={(e) =>
                        setForm({ ...form, gateway_id: e.target.value })
                      }
                    >
                      <option value="">-- Chọn gateway --</option>
                      {gateways.map((g) => (
                        <option key={g.gateway_id} value={g.gateway_id}>
                          {g.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Slave ID / Unit ID</label>
                    <input
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Slave ID / Unit ID"
                      value={form.slave_id || ""}
                      onChange={(e) =>
                        setForm({ ...form, slave_id: e.target.value })
                      }
                    />
                  </div>
                </>
              )}

              {/* ETHERNET MODE */}
              {form.connection_type === "ethernet" && (
                <>
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
                      <label className="block text-sm font-medium text-slate-700 mb-1">Port</label>
                      <input
                        type="number"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="502"
                        value={form.port || ""}
                        onChange={(e) =>
                          setForm({ ...form, port: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Slave ID / Unit ID</label>
                    <input
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Slave ID / Unit ID (optional)"
                      value={form.slave_id || ""}
                      onChange={(e) =>
                        setForm({ ...form, slave_id: e.target.value })
                      }
                    />
                  </div>
                </>
              )}

              {/* DEVICE TYPE */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Device Type</label>
                <select
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
                  value={form.device_type_id}
                  onChange={(e) => {
                    setForm({ ...form, device_type_id: e.target.value, product_line_id: "" });
                    loadProductLinesByDeviceType(e.target.value);
                  }}
                >
                  <option value="">-- Chọn loại thiết bị --</option>
                  {deviceTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* PRODUCT LINE */}
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
