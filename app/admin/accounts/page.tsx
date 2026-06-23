"use client";
import { api } from "@/lib/api";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader,
  AlertCircle,
  Edit2,
  Trash2,
  KeyRound,
  ShieldAlert,
  Plus,
  Check,
  X,
} from "lucide-react";

type AdminAccount = {
  admin_id: string;
  name: string;
  email: string;
  role: "admin" | "manager";
  image_url: string | null;
  created_at: string;
};

export default function AccountManagementPage() {
  const [accounts, setAccounts] = useState<AdminAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const authToken = localStorage.getItem("adminToken");
    setToken(authToken);
    if (!authToken) {
      router.replace("/404");
    }
  }, [router]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", role: "manager" as "admin" | "manager" });

  const [resetId, setResetId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  const loadAccounts = async () => {
    setLoading(true);
    setError("");

    try {
      const { data } = await api.get("/api/admin/accounts");
      setAccounts(Array.isArray(data.data) ? data.data : []);
    } catch (err) {
      console.error(err);
      setError("Cannot load accounts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const handleSave = async (adminId: string) => {
    setSaving(true);
    try {
      const { data } = await api.put(
        `/api/admin/accounts/${adminId}`,
        form
      );

      setAccounts((prev) =>
        prev.map((a) =>
          a.admin_id === adminId ? { ...a, ...data.data } : a
        )
      );

      setEditingId(null);
    } catch (err) {
      console.error(err);
      alert("Update failed");
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetId || !newPassword) return;

    setSaving(true);
    try {
      await api.put(
        `/api/admin/accounts/${resetId}/password`,
        { password: newPassword }
      );

      alert("Password updated successfully");
      setResetId(null);
      setNewPassword("");
    } catch (err) {
      console.error(err);
      alert("Reset password failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (adminId: string) => {
    const ok = confirm("Are you sure you want to delete this admin account?");
    if (!ok) return;

    setSaving(true);
    try {
      await api.delete(`/api/admin/accounts/${adminId}`);

      setAccounts((prev) =>
        prev.filter((a) => a.admin_id !== adminId)
      );

      alert("Admin deleted successfully");
    } catch (err) {
      console.error(err);
      alert("Delete failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* HEADER */}
      <div className="border-b border-slate-200 bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-5 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-100 rounded-lg">
              <ShieldAlert className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Admin Accounts</h1>
              <p className="text-sm text-slate-500 mt-1">Manage admin users and permissions</p>
            </div>
          </div>
          <button
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
            onClick={() => router.push("/admin/accounts/add")}
          >
            <Plus className="w-4 h-4" />
            Add Admin
          </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader className="w-6 h-6 text-slate-600 animate-spin" />
            </div>
          )}

          {error && (
            <div className="m-6 flex items-center gap-3 text-red-600 bg-red-50 p-4 rounded-lg">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {!loading && !error && accounts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ShieldAlert className="w-12 h-12 text-slate-300 mb-4" />
              <p className="text-slate-600 font-medium">No admin accounts found</p>
            </div>
          )}

          {!loading && !error && accounts.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold text-slate-700 w-[250px]">Name</th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-700 w-[250px]">Email</th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-700 w-[140px]">Role</th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-700 w-[140px]">Created</th>
                    <th className="px-6 py-3 text-center font-semibold text-slate-700 w-[180px]">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200">
                  {accounts.map((a) => (
                    <tr key={a.admin_id} className="hover:bg-slate-50 transition-colors">
                      {editingId === a.admin_id ? (
                        <>
                          <td className="px-6 py-4">
                            <input
                              className="w-full px-2 py-1.5 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-slate-900"
                              value={form.name}
                              onChange={(e) =>
                                setForm({ ...form, name: e.target.value })
                              }
                            />
                          </td>
                          <td className="px-6 py-4 text-slate-600">
                            {a.email}
                          </td>
                          <td className="px-6 py-4">
                            <select
                              className="px-2 py-1.5 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-slate-900"
                              value={form.role}
                              onChange={(e) =>
                                setForm({
                                  ...form,
                                  role: e.target.value as "admin" | "manager",
                                })
                              }
                            >
                              <option value="admin">Admin</option>
                              <option value="manager">Manager</option>
                            </select>
                          </td>
                          <td className="px-6 py-4 text-slate-600 text-sm">
                            {new Date(a.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                className="p-1.5 text-slate-600 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                                onClick={() => handleSave(a.admin_id)}
                                disabled={saving}
                                title="Save"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                                onClick={() => setEditingId(null)}
                                title="Cancel"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-6 py-4">
                            <span className="font-medium text-slate-900">{a.name}</span>
                          </td>
                          <td className="px-6 py-4 text-slate-600">
                            {a.email}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-semibold inline-block ${
                                a.role === "admin"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-blue-100 text-blue-700"
                              }`}
                            >
                              {a.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-600 text-sm">
                            {new Date(a.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                className="p-1.5 text-slate-600 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors"
                                onClick={() => {
                                  setEditingId(a.admin_id);
                                  setForm({ name: a.name, role: a.role });
                                }}
                                title="Edit"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>

                              <button
                                className="p-1.5 text-slate-600 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                                onClick={() => setResetId(a.admin_id)}
                                title="Reset password"
                              >
                                <KeyRound className="w-4 h-4" />
                              </button>

                              <button
                                className="p-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                onClick={() => handleDelete(a.admin_id)}
                                disabled={saving}
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* RESET PASSWORD MODAL */}
      {resetId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96 shadow-lg">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Reset Password</h2>
            <input
              type="password"
              placeholder="New password"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 mb-4"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                onClick={() => setResetId(null)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                onClick={handleResetPassword}
                disabled={saving}
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
