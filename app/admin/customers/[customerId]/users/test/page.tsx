"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
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

  /* ===== SEND EMAIL STATE ===== */
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sendMsg, setSendMsg] = useState("");

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("adminToken")
      : null;

  /* ================= LOAD CUSTOMER ================= */
  const loadCustomer = async () => {
    try {
   const { data } = await api.get(
        `/api/admin/customers/${customerId}`,);
      setCustomer(data);
    } catch (err) {
      console.error(err);
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

    console.log("Users API response:", data?.data);
    setUsers(Array.isArray(data?.data) ? data.data : []);
  } catch (err) {
    console.error("Load users error:", err);
    setError("Cannot load users");
  } finally {
    setLoading(false);
  }
};

  /* ================= SEND EMAIL ================= */
  const handleSendEmail = async () => {
  if (!email) {
    alert("Vui lòng nhập email");
    return;
  }

  setSending(true);
  setSendMsg("");

  try {
    await api.post(
      "/api/admin/users/send-account-email",
      { email }
    );

    setSendMsg("✅ Gửi email thành công");
    setEmail("");
  } catch (err: any) {
    console.error(err);
    setSendMsg(
      err?.response?.data?.message || "❌ Gửi email thất bại"
    );
  } finally {
    setSending(false);
  }
};
  /* ================= INIT ================= */
  useEffect(() => {
    if (!customerId) return;
    loadCustomer();
    loadUsers();
  }, [customerId]);

  return (
    <div className="p-6 text-black space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Users of {customer?.name || "Customer"}
          </h1>
          <p className="text-sm text-gray-500">
            Customer code: {customer?.code || "-"}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
            onClick={() =>
              router.push(`/admin/customers/${customerId}/users/add`)
            }
          >
            + Add User
          </button>

          <button
            className="px-4 py-2 border rounded hover:bg-gray-100"
            onClick={() => router.push("/admin/customers")}
          >
            ← Back
          </button>
        </div>
      </div>

      {/* SEND EMAIL BOX */}
      <div className="bg-white border rounded-lg p-4 space-y-3">
        <h2 className="font-semibold">📧 Gửi email thông báo tạo tài khoản</h2>

        <div className="flex gap-2">
          <input
            type="email"
            placeholder="Nhập email khách hàng"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 px-3 py-2 border rounded"
          />

          <button
            onClick={handleSendEmail}
            disabled={sending}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {sending ? "Đang gửi..." : "Gửi Email"}
          </button>
        </div>

        {sendMsg && (
          <p className="text-sm text-gray-700">{sendMsg}</p>
        )}
      </div>

      {/* USERS TABLE */}
      <div className="bg-white border rounded-lg shadow-sm overflow-x-auto">
        {loading && (
          <p className="p-4 text-sm text-gray-500">Loading users...</p>
        )}

        {error && (
          <p className="p-4 text-sm text-red-600">{error}</p>
        )}

        {!loading && !error && (
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 border">Name</th>
                <th className="p-3 border">Email</th>
                <th className="p-3 border">Phone</th>
                <th className="p-3 border">Customer</th>
                <th className="p-3 border">Address</th>
                <th className="p-3 border">Created At</th>
              </tr>
            </thead>

            <tbody>
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              )}

              {users.map((u) => (
                <tr key={u.user_id} className="hover:bg-gray-50">
                  <td className="p-3 border font-medium">{u.name}</td>
                  <td className="p-3 border">{u.email}</td>
                  <td className="p-3 border">{u.phone || "-"}</td>
                  <td className="p-3 border">{u.customer_name}</td>
                  <td className="p-3 border">{u.address || "-"}</td>
                  <td className="p-3 border">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
