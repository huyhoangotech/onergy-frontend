"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { ArrowLeft, User, Mail, Phone, MapPin, Upload, Save, Loader2 } from "lucide-react";

type User = {
  user_id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  customer_id: string | null;
  customer_name: string | null;
  image_url: string | null;
};

export default function UserDetailPage() {
  const { userId } = useParams<{ userId: string }>();
  const router = useRouter();

  const [token, setToken] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
  });

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const authToken = localStorage.getItem("adminToken");
    setToken(authToken);
    setMounted(true);
    if (!authToken) {
      router.replace("/404");
    }
  }, [router]);

  const loadUser = async () => {
    setLoading(true);
    setError("");

    try {
      const { data } = await api.get(`/api/admin/users/${userId}`);

      const userData = data.data;
      setUser(userData);
      setForm({
        name: userData.name,
        phone: userData.phone || "",
        address: userData.address || "",
      });

      if (userData.image_url) {
        setAvatarPreview(
          `${process.env.NEXT_PUBLIC_API_BASE}${userData.image_url}`
        );
      }
    } catch (err) {
      console.error(err);
      setError("Cannot load user");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId && mounted && token) {
      loadUser();
    }
  }, [userId, mounted, token]);

  const handleSaveInfo = async () => {
    setSaving(true);
    try {
      const { data } = await api.put(`/api/admin/users/${userId}`, form);

      setUser(data.data);
      alert("User updated");
    } catch (err) {
      console.error(err);
      alert("Update failed");
    } finally {
      setSaving(false);
    }
  };

  const handleUploadAvatar = async () => {
    if (!avatarFile) return;

    const formData = new FormData();
    formData.append("avatar", avatarFile);

    setUploadingAvatar(true);
    try {
      const { data } = await api.put(
        `/api/admin/users/${userId}/avatar`,
        formData
      );

      setUser((prev) =>
        prev ? { ...prev, image_url: data.data.image_url } : prev
      );
      setAvatarFile(null);
      alert("Avatar updated");
    } catch (err) {
      console.error(err);
      alert("Upload avatar failed");
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (!mounted) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-slate-600">Loading user...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-6">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
            {error}
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* HEADER */}
      <div className="border-b border-slate-200 bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">User Details</h1>
              <p className="text-sm text-slate-500">Manage user information</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 sm:px-6">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* AVATAR SECTION */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Profile Picture</h2>
          <div className="flex items-start gap-6">
            <div className="w-24 h-24 rounded-lg overflow-hidden bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center flex-shrink-0">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-3xl font-semibold text-blue-600">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            <div className="flex-1">
              <label className="flex items-center justify-center w-full px-4 py-2 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-blue-400 transition-colors">
                <div className="flex items-center gap-2">
                  <Upload className="w-4 h-4 text-slate-600" />
                  <span className="text-sm font-medium text-slate-700">
                    {avatarFile ? "Change image" : "Upload image"}
                  </span>
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

              {avatarFile && (
                <button
                  onClick={handleUploadAvatar}
                  disabled={uploadingAvatar}
                  className="mt-3 w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
                >
                  {uploadingAvatar && <Loader2 className="w-4 h-4 animate-spin" />}
                  {uploadingAvatar ? "Uploading..." : "Save Image"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* INFORMATION SECTION */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Personal Information</h2>

          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                <User className="w-4 h-4 text-slate-500" />
                Name
              </label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900"
              />
            </div>

            {/* Email */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                <Mail className="w-4 h-4 text-slate-500" />
                Email
              </label>
              <input
                value={user.email}
                disabled
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-500 cursor-not-allowed"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                <Phone className="w-4 h-4 text-slate-500" />
                Phone
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900"
              />
            </div>

            {/* Address */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                <MapPin className="w-4 h-4 text-slate-500" />
                Address
              </label>
              <textarea
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 resize-none"
              />
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSaveInfo}
            disabled={saving}
            className="mt-6 w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
