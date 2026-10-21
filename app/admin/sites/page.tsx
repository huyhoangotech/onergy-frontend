"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import {
  Loader,
  AlertCircle,
  Edit2,
  Eye,
  MapPin,
  Building,
  Zap,
  CalendarDays,
  Users,
} from "lucide-react";

/* ================= TYPES ================= */
type Site = {
  site_id: string;
  name: string;
  address: string | null;
  customer_name: string;
  created_at: string;
  total_devices: number;
};

/* ================= PAGE ================= */
export default function SiteManagementPage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      router.replace("/404");
    }
  }, [router]);

  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editingSiteId, setEditingSiteId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", address: "" });
  const [saving, setSaving] = useState(false);

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("adminToken")
      : null;

  /* ================= LOAD SITES ================= */
  const loadSites = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/api/admin/sites");
      setSites(Array.isArray(data.data) ? data.data : []);
    } catch (err) {
      console.error("Load sites failed:", err);
      setError("Cannot load sites");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSites();
  }, []);

  /* ================= SAVE SITE ================= */
  const handleSave = async (siteId: string) => {
    setSaving(true);
    try {
      const { data } = await api.put(`/api/admin/sites/${siteId}`, form);

      setSites((prev) =>
        prev.map((s) =>
          s.site_id === siteId ? { ...s, ...data.data } : s
        )
      );

      setEditingSiteId(null);
    } catch (err) {
      console.error("Update site failed:", err);
    } finally {
      setSaving(false);
    }
  };

  /* ================= UI ================= */
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* HEADER */}
      <div className="border-b border-slate-200 bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-100 rounded-lg">
              <Building className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Site Management</h1>
              <p className="text-sm text-slate-500 mt-1">Manage all sites and their devices</p>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader className="w-6 h-6 text-purple-600 animate-spin" />
            </div>
          )}

          {error && (
            <div className="m-6 flex items-center gap-3 text-red-600 bg-red-50 p-4 rounded-lg">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {!loading && !error && sites.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Building className="w-12 h-12 text-slate-300 mb-4" />
              <p className="text-slate-600 font-medium">No sites found</p>
            </div>
          )}

          {!loading && !error && sites.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold text-slate-700 w-[200px]">Site Name</th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-700 w-[200px]">Customer</th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-700 w-[250px]">Address</th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-700 w-[140px]">Devices</th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-700 w-[140px]">Created</th>
                    <th className="px-6 py-3 text-center font-semibold text-slate-700 w-[140px]">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200">
                  {sites.map((site) => (
                    <tr key={site.site_id} className="hover:bg-slate-50 transition-colors">
                      {/* SITE NAME */}
                      <td className="px-6 py-4">
                        {editingSiteId === site.site_id ? (
                          <input
                            type="text"
                            value={form.name}
                            onChange={(e) =>
                              setForm({ ...form, name: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        ) : (
                          <span className="font-medium text-slate-900">
                            {site.name}
                          </span>
                        )}
                      </td>

                      {/* CUSTOMER */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-slate-600">
                          <Users className="w-4 h-4 text-slate-400 flex-shrink-0" />
                          {site.customer_name}
                        </div>
                      </td>

                      {/* ADDRESS */}
                      <td className="px-6 py-4">
                        {editingSiteId === site.site_id ? (
                          <input
                            type="text"
                            value={form.address}
                            onChange={(e) =>
                              setForm({ ...form, address: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        ) : (
                          <div className="flex items-center gap-2 text-slate-600">
                            <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
                            {site.address || "-"}
                          </div>
                        )}
                      </td>

                      {/* DEVICES */}
                 
{/* DEVICES */}
<td className="px-6 py-4">
  <button
    onClick={() =>
      router.push(`/admin/sites/${site.site_id}/device`)
    }
    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:underline"
    title="View site devices"
  >
    <Zap className="w-4 h-4 text-slate-400 flex-shrink-0" />
    <span>{site.total_devices}</span>
  </button>
</td>



                      {/* CREATED AT */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-slate-600 text-sm">
                          <CalendarDays className="w-4 h-4 text-slate-400 flex-shrink-0" />
                          {new Date(site.created_at).toLocaleDateString()}
                        </div>
                      </td>

                      {/* ACTIONS */}
                      <td className="px-6 py-4 text-center">
                        {editingSiteId === site.site_id ? (
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleSave(site.site_id)}
                              disabled={saving}
                              className="px-3 py-1.5 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors disabled:opacity-50"
                            >
                              {saving ? "Saving..." : "Save"}
                            </button>
                            <button
                              onClick={() => setEditingSiteId(null)}
                              className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() =>
                                router.push(`/admin/sites/${site.site_id}`)
                              }
                              className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="View"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => {
                                setEditingSiteId(site.site_id);
                                setForm({
                                  name: site.name,
                                  address: site.address || "",
                                });
                              }}
                              className="p-1.5 text-slate-600 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
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
