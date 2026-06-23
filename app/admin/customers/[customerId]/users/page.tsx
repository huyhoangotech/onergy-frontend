"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Users, ArrowLeft, Plus } from "lucide-react";

/* ================= TYPES ================= */
type User = {
  user_id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  customer_name: string;
  image_url: string | null;
  created_at: string;
};

type Customer = {
  customer_id: string;
  name: string;
  code: string;
  address: string | null;
  created_at: string;
};

/* ================= PAGE ================= */
export default function CustomerUsersPage() {
  const router = useRouter();
  const { customerId } = useParams<{ customerId: string }>();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  /* ================= LOAD CUSTOMER ================= */
  const loadCustomer = async () => {
    try {
      const { data } = await api.get(
        `/api/admin/customers/${customerId}`
      );
      setCustomer(data);
    } catch (err) {
      console.error("Load customer error:", err);
      setCustomer(null);
    }
  };

  /* ================= LOAD USERS ================= */
  const loadUsers = async () => {
    setLoading(true);
    setError("");

    try {
      const { data } = await api.get(
        `/api/admin/customers/${customerId}/users`
      );
      setUsers(Array.isArray(data?.data) ? data.data : []);
    } catch (err) {
      console.error("Load users error:", err);
      setError("Cannot load users");
    } finally {
      setLoading(false);
    }
  };

  /* ================= INIT ================= */
  useEffect(() => {
    const authToken = localStorage.getItem("adminToken");
    setToken(authToken);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!customerId || !token) return;
    loadCustomer();
    loadUsers();
  }, [customerId, token]);

  /* ================= UI ================= */
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {!mounted && (
        <div className="flex justify-center items-center py-12">
          <div className="text-slate-600">Loading...</div>
        </div>
      )}

      {mounted && (
        <>
          {/* HEADER */}
          <div className="border-b border-slate-200 bg-white shadow-sm sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-4 py-5 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                      Users of {customer?.name || "Customer"}
                    </h1>
                    <p className="text-sm text-slate-500">
                      Customer code: {customer?.code || "-"}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    onClick={() =>
                      router.push(`/admin/customers/${customerId}/users/add`)
                    }
                  >
                    <Plus className="w-4 h-4" />
                    Add User
                  </button>
                  <button
                    className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                    onClick={() => router.back()}
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* CONTENT */}
          <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
            {loading && (
              <div className="text-center py-12">
                <p className="text-slate-600">Loading users...</p>
              </div>
            )}

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-4 mb-6">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {!loading && !error && (
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                {users.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-slate-600">No users found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="px-6 py-3 text-left font-semibold text-slate-900">Name</th>
                          <th className="px-6 py-3 text-left font-semibold text-slate-900">Email</th>
                          <th className="px-6 py-3 text-left font-semibold text-slate-900">Phone</th>
                          <th className="px-6 py-3 text-left font-semibold text-slate-900">Customer</th>
                          <th className="px-6 py-3 text-left font-semibold text-slate-900">Address</th>
                          <th className="px-6 py-3 text-left font-semibold text-slate-900">Created At</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {users.map((u) => (
                          <tr key={u.user_id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full overflow-hidden bg-blue-100 flex items-center justify-center flex-shrink-0">
                                  {u.image_url ? (
                                    <img
                                      src={`https://be.otech.vn${u.image_url}`}
                                      alt={u.name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <span className="text-xs font-medium text-blue-700">
                                      {u.name.charAt(0).toUpperCase()}
                                    </span>
                                  )}
                                </div>
                                <span className="font-medium text-slate-900">{u.name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-slate-700">{u.email}</td>
                            <td className="px-6 py-4 text-slate-700">{u.phone || "-"}</td>
                            <td className="px-6 py-4 text-slate-700">{u.customer_name}</td>
                            <td className="px-6 py-4 text-slate-700">{u.address || "-"}</td>
                            <td className="px-6 py-4 text-slate-700">
                              {new Date(u.created_at).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
