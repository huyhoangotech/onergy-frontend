"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import {
  Loader,
  AlertCircle,
  Edit2,
  Trash2,
  KeyRound,
  Users,
  Mail,
  Phone,
  Building2
} from "lucide-react";

/* ================= TYPES ================= */
type User = {
  user_id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  customer_name: string | null;
  image_url: string | null;
  created_at: string;
};

/* ================= PAGE ================= */
export default function UsersPage() {
  const router = useRouter();
 useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      router.replace("/404");
    }
  }, [router]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("adminToken")
      : null;

  /* ================= LOAD USERS ================= */
  const loadUsers = async () => {
  setLoading(true);
  setError("");

  try {
    const { data } = await api.get("/api/admin/users");

    setUsers(Array.isArray(data.data) ? data.data : []);
  } catch (err) {
    console.error("Load users error:", err);
    setError("Cannot load users");
  } finally {
    setLoading(false);
  }
};


  useEffect(() => {
    loadUsers();
  }, []);

  /* ================= DELETE USER ================= */
 const handleDeleteUser = async (userId: string) => {
  const confirmDelete = confirm(
    "Are you sure you want to delete this user?"
  );
  if (!confirmDelete) return;

  try {
    const { data } = await api.delete(
      `/api/admin/users/${userId}`
    );

    if (!data.success) {
      alert(data.message);
      return;
    }

    alert(data.message);
    loadUsers();
  } catch (err) {
    console.error("Delete user error:", err);
    alert("Unexpected error");
  }
};

  /* ================= UI ================= */
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* HEADER */}
      <div className="border-b border-slate-200 bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
              <p className="text-sm text-slate-500 mt-1">Manage all users in the system</p>
            </div>
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

          {!loading && !error && users.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="w-12 h-12 text-slate-300 mb-4" />
              <p className="text-slate-600 font-medium">No users found</p>
            </div>
          )}

          {!loading && !error && users.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                   <th className="px-6 py-3 text-left font-semibold text-slate-700 w-[250px]">User</th>
<th className="px-6 py-3 text-left font-semibold text-slate-700 w-[250px]">Email</th>
<th className="px-6 py-3 text-left font-semibold text-slate-700 w-[160px]">Phone</th>
<th className="px-6 py-3 text-left font-semibold text-slate-700 w-[200px]">Customer</th>
<th className="px-6 py-3 text-left font-semibold text-slate-700 w-[140px]">Created</th>
<th className="px-6 py-3 text-center font-semibold text-slate-700 w-[140px]">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200">
                  {users.map((u) => (
                    <tr key={u.user_id} className="hover:bg-slate-50 transition-colors">
                      {/* NAME + AVATAR */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-200 flex items-center justify-center flex-shrink-0 border border-slate-300">
                            {u.image_url ? (
                              <img
                                src={`https://be.otech.vn${u.image_url}`}
                                alt={u.name}
                                className="w-full h-full object-cover"
                                crossOrigin="anonymous"
                              />
                            ) : (
                              <span className="text-xs font-bold text-slate-600">
                                {u.name.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <span className="font-medium text-slate-900">{u.name}</span>
                        </div>
                      </td>

                     <td className="px-6 py-4 text-slate-600">
  <div className="flex items-center gap-2">
    <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
    {u.email}
  </div>
</td>

<td className="px-6 py-4 text-slate-600">
  <div className="flex items-center gap-2">
    <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
    {u.phone || "-"}
  </div>
</td>

<td className="px-6 py-4 text-slate-600">
  <div className="flex items-center gap-2">
    <Building2 className="w-4 h-4 text-slate-400 flex-shrink-0" />
    {u.customer_name || "-"}
  </div>
</td>
                      <td className="px-6 py-4 text-slate-600 text-sm">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>

                      {/* ACTIONS */}
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() =>
                              router.push(`/admin/users/${u.user_id}`)
                            }
                            className="p-1.5 text-slate-600 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() =>
                              router.push(`/admin/users/${u.user_id}/reset_password`)
                            }
                            className="p-1.5 text-slate-600 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                            title="Reset password"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDeleteUser(u.user_id)}
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
    </div>
  );
}
