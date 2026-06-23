"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { 
  Settings, 
  Eye, 
  Plus, 
  Loader, 
  AlertCircle, 
  Edit2, 
  Trash2, 
  Users, 
  MapPin, 
  Smartphone 
} from "lucide-react";

type Customer = {
  customer_id: string;
  name: string;
  code: string;
  address: string;
  total_users: number;
  total_sites: number;
  total_devices: number;
  created_at: string;
};

export default function CustomerManagementPage() {
  const router = useRouter();
 useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      router.replace("/404");
    }
  }, [router]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [showEditModal, setShowEditModal] = useState(false);

  const [editingCustomer, setEditingCustomer] =
    useState<Customer | null>(null);

  const [editForm, setEditForm] = useState({
    name: "",
    code: "",
    address: "",
  });

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("adminToken")
      : null;

  /* ================= LOAD CUSTOMERS ================= */
  const loadCustomers = async () => {
  setLoading(true);
  setError("");

  try {
    const { data } = await api.get("/api/admin/customers");

    setCustomers(Array.isArray(data) ? data : []);
  } catch (err) {
    console.error(err);
    setError("Cannot load customers");
  } finally {
    setLoading(false);
  }
};


  useEffect(() => {
    loadCustomers();
  }, []);

  /* ================= DELETE ================= */
  const handleDeleteCustomer = async (customerId: string) => {
  const confirmDelete = confirm(
    "Are you sure you want to delete this customer?\nAll related data may be affected."
  );

  if (!confirmDelete) return;

  try {
    const { data } = await api.delete(
      `/api/admin/customers/${customerId}`
    );

    if (!data.success) {
      alert(data.message);
      return;
    }

    alert(data.message);
    loadCustomers();
  } catch (err: any) {
    console.error("Delete customer error:", err);
    alert(err?.response?.data?.message || "Failed to delete customer");
  }
};


  /* ================= UPDATE ================= */
  const handleUpdateCustomer = async () => {
  if (!editingCustomer) return;

  try {
    const { data } = await api.put(
      `/api/admin/customers/${editingCustomer.customer_id}`,
      editForm
    );

    if (!data.success) {
      alert(data.message || "Update failed");
      return;
    }

    alert("Customer updated successfully");
    setShowEditModal(false);
    setEditingCustomer(null);
    loadCustomers();
  } catch (err: any) {
    console.error(err);
    alert(err?.response?.data?.message || "Update customer failed");
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
              <h1 className="text-2xl font-bold text-slate-900">Customer Management</h1>
              <p className="text-sm text-slate-500 mt-1">Manage all customers and their resources</p>
            </div>
            <button
              onClick={() => router.push("/admin/customers/add")}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Customer
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

          {!loading && !error && customers.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="w-12 h-12 text-slate-300 mb-4" />
              <p className="text-slate-600 font-medium">No customers found</p>
              <p className="text-sm text-slate-500 mt-1">Create your first customer to get started</p>
            </div>
          )}

          {!loading && !error && customers.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold text-slate-700">Code</th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-700">Company</th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-700">Address</th>
                    <th className="px-6 py-3 text-center font-semibold text-slate-700">Users</th>
                    <th className="px-6 py-3 text-center font-semibold text-slate-700">Sites</th>
                    <th className="px-6 py-3 text-center font-semibold text-slate-700">Devices</th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-700">Created</th>
                    <th className="px-6 py-3 text-center font-semibold text-slate-700">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200">
                  {customers.map((c) => (
                    <tr key={c.customer_id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-slate-600">{c.code}</td>
                      <td className="px-6 py-4 font-medium text-slate-900">{c.name}</td>
                      <td className="px-6 py-4 text-slate-600 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        {c.address || "-"}
                      </td>

                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() =>
                            router.push(
                              `/admin/customers/${c.customer_id}/users`
                            )
                          }
                          className="inline-flex items-center gap-1.5 px-2 py-1 text-blue-700 bg-blue-50 rounded hover:bg-blue-100 transition-colors"
                          title="View users"
                        >
                          <Users className="w-4 h-4" />
                          {c.total_users}
                        </button>
                      </td>

                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() =>
                            router.push(
                              `/admin/customers/${c.customer_id}/sites`
                            )
                          }
                          className="inline-flex items-center gap-1.5 px-2 py-1 text-purple-700 bg-purple-50 rounded hover:bg-purple-100 transition-colors"
                          title="View sites"
                        >
                          <MapPin className="w-4 h-4" />
                          {c.total_sites}
                        </button>
                      </td>

                      <td className="px-6 py-4 text-center">
  <button
    onClick={() =>
      router.push(`/admin/customers/${c.customer_id}/devices`)
    }
    className="inline-flex items-center gap-1.5 px-2 py-1 text-slate-700 bg-slate-100 rounded hover:bg-slate-200 transition"
  >
    <Smartphone className="w-4 h-4" />
    {c.total_devices}
  </button>
</td>

                      <td className="px-6 py-4 text-sm text-slate-600">
                        {new Date(c.created_at).toLocaleDateString()}
                      </td>

                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() =>
                              router.push(`/admin/customers/${c.customer_id}/storage`)
                            }
                            className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                            title="Configure"
                          >
                            <Settings className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() =>
                              router.push(`/admin/customers/${c.customer_id}/history`)
                            }
                            className="p-1.5 text-slate-600 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                            title="View history"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => {
                              setEditingCustomer(c);
                              setEditForm({
                                name: c.name,
                                code: c.code,
                                address: c.address || "",
                              });
                              setShowEditModal(true);
                            }}
                            className="p-1.5 text-slate-600 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() =>
                              handleDeleteCustomer(c.customer_id)
                            }
                            className="p-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
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
        </div>
      </div>

      {/* ================= EDIT MODAL ================= */}
      {showEditModal && editingCustomer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6 shadow-lg">
            <h2 className="text-xl font-bold text-slate-900 mb-6">
              Edit Customer
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Code
                </label>
                <input
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={editForm.code}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      code: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Company Name
                </label>
                <input
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      name: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Address
                </label>
                <input
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={editForm.address}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      address: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingCustomer(null);
                }}
              >
                Cancel
              </button>

              <button
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                onClick={handleUpdateCustomer}
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
