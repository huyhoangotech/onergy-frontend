"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Wifi, Plus, Eye, Edit2, Trash2, Check, X } from "lucide-react";

type Gateway = {
  gateway_id: string;
  name: string;
  host: string;
  port: number;
  protocol: string;
  status: number | null;
  site_name: string;
  created_at: string;
  site_id: string;
};

type Site = {
  site_id: string;
  name: string;
};

export default function GatewayManagementPage() {
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  const [gateways, setGateways] = useState<Gateway[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [editingGatewayId, setEditingGatewayId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    host: "",
    port: 502,
    protocol: "modbus-tcp",
    site_id: "",
  });

  const [saving, setSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const [newGateway, setNewGateway] = useState({
    name: "",
    host: "",
    port: 502,
    protocol: "modbus-tcp",
    site_id: "",
  });

  const [creating, setCreating] = useState(false);
  const [sites, setSites] = useState<Site[]>([]);

  const loadGateways = async () => {
    setLoading(true);
    setError("");

    try {
      const { data } = await api.get("/api/admin/gateways");
      setGateways(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Load gateways failed:", err);
      setError("Cannot load gateways");
    } finally {
      setLoading(false);
    }
  };

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
    setMounted(true);
    setToken(localStorage.getItem("adminToken"));
  }, []);

  useEffect(() => {
    const authToken = localStorage.getItem("adminToken");
    setToken(authToken);
    setMounted(true);
    if (!authToken) {
      router.replace("/404");
    }
  }, [router]);

  useEffect(() => {
    if (!token) return;
    loadGateways();
    loadSites();
  }, [token]);

  const handleSave = async (gatewayId: string) => {
    setSaving(true);

    try {
      const { data } = await api.put(`/api/admin/gateways/${gatewayId}`, form);

      setGateways((prev) =>
        prev.map((g) =>
          g.gateway_id === gatewayId ? { ...g, ...data } : g
        )
      );

      setEditingGatewayId(null);
    } catch (err) {
      console.error("Update gateway failed:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateGateway = async () => {
    setCreating(true);

    try {
      const { data } = await api.post("/api/admin/gateways", newGateway);

      setGateways((prev) => [data, ...prev]);

      setShowAddForm(false);

      setNewGateway({
        name: "",
        host: "",
        port: 502,
        protocol: "modbus-tcp",
        site_id: "",
      });
    } catch (err) {
      console.error("Create gateway failed:", err);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteGateway = async (gatewayId: string) => {
    const confirmDelete = confirm("Are you sure you want to delete this gateway?");
    if (!confirmDelete) return;

    try {
      await api.delete(`/api/admin/gateways/${gatewayId}`);

      setGateways((prev) =>
        prev.filter((g) => g.gateway_id !== gatewayId)
      );
    } catch (err) {
      console.error("Delete gateway failed:", err);
      alert("Cannot delete gateway");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Wifi className="w-5 h-5 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Gateways</h1>
          </div>
          <p className="text-sm text-slate-600 ml-11">Manage all communication gateways</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {!mounted && (
          <div className="flex justify-center items-center py-12">
            <div className="text-slate-600">Loading...</div>
          </div>
        )}

        {mounted && (
          <>
        {/* Add Gateway Button */}
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="mb-6 flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Gateway
        </button>

        {/* Add Gateway Form */}
        {showAddForm && (
          <div className="mb-6 p-6 bg-white rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-lg font-semibold text-slate-900">Create New Gateway</h3>

            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Gateway Name"
                value={newGateway.name}
                onChange={(e) =>
                  setNewGateway({ ...newGateway, name: e.target.value })
                }
                className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />

              <input
                type="text"
                placeholder="Host / IP"
                value={newGateway.host}
                onChange={(e) =>
                  setNewGateway({ ...newGateway, host: e.target.value })
                }
                className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />

              <input
                type="number"
                placeholder="Port"
                value={newGateway.port}
                onChange={(e) =>
                  setNewGateway({ ...newGateway, port: Number(e.target.value) })
                }
                className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />

              <input
                type="text"
                placeholder="Protocol"
                value={newGateway.protocol}
                onChange={(e) =>
                  setNewGateway({ ...newGateway, protocol: e.target.value })
                }
                className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <select
              value={newGateway.site_id}
              onChange={(e) =>
                setNewGateway({ ...newGateway, site_id: e.target.value })
              }
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Site</option>
              {sites.map((site) => (
                <option key={site.site_id} value={site.site_id}>
                  {site.name}
                </option>
              ))}
            </select>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleCreateGateway}
                className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                disabled={creating}
              >
                {creating ? "Creating..." : "Create"}
              </button>

              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Loading & Error States */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="text-slate-600">Loading gateways...</div>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 mb-6">
            {error}
          </div>
        )}

        {/* Gateways Table */}
        {!loading && !error && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {gateways.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                No gateways created yet
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 text-left font-semibold text-slate-900">Name</th>
                      <th className="px-6 py-3 text-left font-semibold text-slate-900">Site</th>
                      <th className="px-6 py-3 text-left font-semibold text-slate-900">Host</th>
                      <th className="px-6 py-3 text-left font-semibold text-slate-900">Port</th>
                      <th className="px-6 py-3 text-left font-semibold text-slate-900">Protocol</th>
                      <th className="px-6 py-3 text-left font-semibold text-slate-900">Status</th>
                      <th className="px-6 py-3 text-left font-semibold text-slate-900">Created</th>
                      <th className="px-6 py-3 text-center font-semibold text-slate-900">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-200">
                    {gateways.map((g) => (
                      <tr key={g.gateway_id} className="hover:bg-slate-50 transition-colors">
                        {editingGatewayId === g.gateway_id ? (
                          <>
                            <td className="px-6 py-4">
                              <input
                                type="text"
                                value={form.name}
                                onChange={(e) =>
                                  setForm({ ...form, name: e.target.value })
                                }
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </td>

                            <td className="px-6 py-4">
                              <select
                                value={form.site_id}
                                onChange={(e) =>
                                  setForm({ ...form, site_id: e.target.value })
                                }
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              >
                                <option value="">Select Site</option>
                                {sites.map((site) => (
                                  <option key={site.site_id} value={site.site_id}>
                                    {site.name}
                                  </option>
                                ))}
                              </select>
                            </td>

                            <td className="px-6 py-4">
                              <input
                                type="text"
                                value={form.host}
                                onChange={(e) =>
                                  setForm({ ...form, host: e.target.value })
                                }
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </td>

                            <td className="px-6 py-4">
                              <input
                                type="number"
                                value={form.port}
                                onChange={(e) =>
                                  setForm({ ...form, port: Number(e.target.value) })
                                }
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </td>

                            <td className="px-6 py-4">
                              <input
                                type="text"
                                value={form.protocol}
                                onChange={(e) =>
                                  setForm({ ...form, protocol: e.target.value })
                                }
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </td>

                            <td className="px-6 py-4">
                              {Number(g.status) === 1 ? (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                                  Online
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                                  Offline
                                </span>
                              )}
                            </td>

                            <td className="px-6 py-4 text-slate-700">
                              {new Date(g.created_at).toLocaleDateString()}
                            </td>

                            <td className="px-6 py-4 text-center">
                              <div className="flex gap-2 justify-center">
                                <button
                                  onClick={() => handleSave(g.gateway_id)}
                                  className="p-2 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition-colors disabled:opacity-50"
                                  disabled={saving}
                                  title="Save"
                                >
                                  <Check className="w-4 h-4" />
                                </button>

                                <button
                                  onClick={() => setEditingGatewayId(null)}
                                  className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                                  title="Cancel"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-6 py-4 text-slate-900 font-medium">{g.name}</td>
                            <td className="px-6 py-4 text-slate-700">{g.site_name}</td>
                            <td className="px-6 py-4 text-slate-700">{g.host}</td>
                            <td className="px-6 py-4 text-slate-700">{g.port}</td>
                            <td className="px-6 py-4 text-slate-700">{g.protocol}</td>
                            <td className="px-6 py-4">
                              {Number(g.status) === 1 ? (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                                  Online
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                                  Offline
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-slate-700">
                              {new Date(g.created_at).toLocaleDateString()}
                            </td>

                            <td className="px-6 py-4 text-center">
                          <div className="flex gap-2 justify-center">
                                <button
                                  onClick={() =>
                                    router.push(`/admin/gateways/${g.gateway_id}`)
                                  }
                                  className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                                  title="View"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>

                                <button
                                  onClick={() => {
                                    setEditingGatewayId(g.gateway_id);
                                    setForm({
                                      name: g.name,
                                      host: g.host,
                                      port: g.port,
                                      protocol: g.protocol,
                                      site_id: g.site_id,
                                    });
                                  }}
                                  className="p-2 rounded-lg bg-cyan-100 text-cyan-600 hover:bg-cyan-200 transition-colors"
                                  title="Edit"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>

                                <button
                                  onClick={() => handleDeleteGateway(g.gateway_id)}
                                  className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
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
        )}
          </>
        )}
      </div>
    </div>
  );
}
