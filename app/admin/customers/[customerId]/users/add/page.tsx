"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { ArrowLeft, Users, Mail, Phone, MapPin, Upload } from "lucide-react";

export default function AddUserPage() {
  const router = useRouter();
  const { customerId } = useParams<{ customerId: string }>();

  const [token, setToken] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

 const [form, setForm] = useState({
  name: "",
  email: "",
  phone: "",
  address: "",
  role: "",   // 👈 thêm
});

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const authToken = localStorage.getItem("adminToken");
    setToken(authToken);
    setMounted(true);
  }, []);

  const handleSubmit = async () => {
    if (!form.name || !form.email) {
      setError("Name and email are required");
      return;
    }

    if (!customerId) {
      setError("Invalid customer");
      return;
    }

    const formData = new FormData();
    formData.append("name", form.name);
    formData.append("email", form.email);
    formData.append("phone", form.phone);
    formData.append("address", form.address);
formData.append("role", form.role);
    if (avatarFile) {
      formData.append("avatar", avatarFile);
    }

    setLoading(true);
    setError("");

    try {
      await api.post(`/api/admin/customers/${customerId}/users`, formData);
      router.push(`/admin/customers/${customerId}/users`);
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || "Cannot create user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Add User</h1>
              <p className="text-sm text-slate-600">
                Create a new user account
              </p>
            </div>
          </div>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        </div>
      </div>

      {/* Form */}
      {mounted && (
        <div className="max-w-3xl mx-auto px-6 py-8">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Avatar Upload */}
            <div className="flex justify-center">
              <label className="cursor-pointer group">
                <div className="relative w-32 h-32 rounded-full border-2 border-dashed border-slate-300 overflow-hidden flex items-center justify-center bg-slate-50 group-hover:border-blue-400 group-hover:bg-blue-50 transition">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center">
                      <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1 group-hover:text-blue-500 transition" />
                      <span className="text-xs text-slate-600 group-hover:text-blue-600 font-medium">
                        Upload Avatar
                      </span>
                    </div>
                  )}
                </div>

                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setAvatarFile(file);
                    setAvatarPreview(URL.createObjectURL(file));
                  }}
                />
              </label>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) =>
                  setForm({ ...form, name: e.target.value })
                }
                placeholder="Enter full name"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-slate-50 text-slate-900 placeholder-slate-500"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-400" />
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm({ ...form, email: e.target.value })
                }
                placeholder="user@example.com"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-slate-50 text-slate-900 placeholder-slate-500"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                <Phone className="w-4 h-4 text-slate-400" />
                Phone
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) =>
                  setForm({ ...form, phone: e.target.value })
                }
                placeholder="+1 (555) 000-0000"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-slate-50 text-slate-900 placeholder-slate-500"
              />
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-slate-400" />
                Address
              </label>
              <input
                type="text"
                value={form.address}
                onChange={(e) =>
                  setForm({ ...form, address: e.target.value })
                }
                placeholder="Enter address"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-slate-50 text-slate-900 placeholder-slate-500"
              />
            </div>
<div>
  <label className="block text-sm font-semibold text-slate-900 mb-2">
    Role
  </label>

  <select
    value={form.role}
    onChange={(e) =>
      setForm({ ...form, role: e.target.value })
    }
    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50"
  >
    <option value="">-- No role (legacy user) --</option>
    <option value="1">Customer Admin</option>
    <option value="2">Site Manager</option>
    <option value="3">Tenant User</option>
  </select>
</div>
            {/* Actions */}
            <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2.5 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-2.5 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Creating..." : "Create User"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
