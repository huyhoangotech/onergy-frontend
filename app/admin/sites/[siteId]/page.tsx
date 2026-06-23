"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import {
  MapPin,
  Trash2,
  Edit2,
  X,
  Check,
  Plus,
  ChevronDown,
  ChevronRight,
  Building2,
  Network,
  AlertCircle,
} from "lucide-react";

type Site = {
  site_id: string;
  name: string;
  address: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  customer_id: string;
  total_devices: number;
};

type Device = {
  device_id: string;
  name: string;
  serial_number: string;
  status: string;
  model: string;
  ip_address: string | null;
};

type User = {
  user_id: string;
  name: string;
  email: string;
  phone: string | null;
};

const StatusBadgeMap: Record<string, { bg: string; text: string; dot: string }> = {
  online: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  offline: { bg: "bg-slate-50", text: "text-slate-700", dot: "bg-slate-400" },
  error: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
  pending: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
};
const typeConfig: Record<
  string,
  { label: string; className: string }
> = {
  site: {
    label: "Site",
    className: "bg-blue-100 text-blue-700",
  },
  station: {
    label: "Station",
    className: "bg-green-100 text-green-700",
  },
  cluster: {
    label: "Cluster",
    className: "bg-purple-100 text-purple-700",
  },
};
export default function SiteDetailPage() {
  const { siteId, customerId } = useParams<{
    siteId: string;
    customerId: string;
  }>();
  const router = useRouter();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [createType, setCreateType] = useState<"station" | "cluster">("station");
  const [editingNode, setEditingNode] = useState<any>(null);
  const [deletingNode, setDeletingNode] = useState<any>(null);

  const [createForm, setCreateForm] = useState({
    name: "",
    parent_id: "",
  });

  const [editForm, setEditForm] = useState({
    name: "",
  });

  const [site, setSite] = useState<Site | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    name: "",
    address: "",
    image_url: "",
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [tree, setTree] = useState<any[]>([]);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [creatingNode, setCreatingNode] = useState(false);
  const [updatingNode, setUpdatingNode] = useState(false);
  const [deletingNodeLoading, setDeletingNodeLoading] = useState(false);

  function buildTree(rows: any[]) {
    const map: any = {};
    const roots: any[] = [];

    rows.forEach((r) => {
      if (!map[r.site_id]) {
        map[r.site_id] = {
          site_id: r.site_id,
          name: r.name,
          type: r.type,
          parent_id: r.parent_id,
          children: [],
          devices: [],
        };
      }

      if (r.device_id) {
        map[r.site_id].devices.push({
          device_id: r.device_id,
          name: r.device_name,
          status: r.status,
          model: r.model,
          serial_number: r.serial_number,
          ip_address: r.ip_address,
        });
      }
    });

    Object.values(map).forEach((node: any) => {
      if (node.parent_id && map[node.parent_id]) {
        map[node.parent_id].children.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  }

  function TreeNode({
    node,
    onSelect,
    onEdit,
    onDelete,
    isSelected,
  }: any) {
    const [expanded, setExpanded] = useState(node.type !== "cluster");
    const hasChildren = node.children && node.children.length > 0;
    const isStation = node.type === "station";
    const type = typeConfig[node.type] || {
  label: node.type,
  className: "bg-slate-100 text-slate-600",
};
    return (
      <div className="relative">
        <div
          className={`flex items-center justify-between gap-3 p-3 rounded-lg group cursor-pointer transition-all ${
            isSelected
              ? "bg-gradient-to-r from-blue-50 to-transparent border-l-4 border-blue-500"
              : "hover:bg-slate-50"
          }`}
          onClick={() => onSelect(node)}
        >
          {/* LEFT SIDE */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {hasChildren && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setExpanded(!expanded);
                }}
                className="p-1 hover:bg-slate-200 rounded transition-colors flex-shrink-0"
              >
                {expanded ? (
                  <ChevronDown className="w-4 h-4 text-slate-500" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                )}
              </button>
            )}
            {!hasChildren && <div className="w-6" />}

            <div className="flex items-center gap-2 flex-1 min-w-0">
              {isStation ? (
                <Building2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
              ) : (
                <Network className="w-4 h-4 text-purple-600 flex-shrink-0" />
              )}
              <span
                className={`font-medium truncate ${
                  isSelected ? "text-blue-700" : "text-slate-700"
                }`}
              >
                {node.name}
              </span>
 <span
  className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${type.className}`}
>
  {type.label}
</span>
            </div>
          </div>

          {/* ACTIONS */}
          <div className="hidden group-hover:flex gap-1 flex-shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setEditForm({ name: node.name });
                setEditingNode(node);
                setShowEditModal(true);
              }}
              className="p-1.5 text-blue-600 hover:bg-blue-100 rounded transition-colors"
              title="Edit"
            >
              <Edit2 className="w-4 h-4" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setDeletingNode(node);
                setShowDeleteModal(true);
              }}
              className="p-1.5 text-red-600 hover:bg-red-100 rounded transition-colors"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {expanded && hasChildren && (
          <div className="ml-2 mt-2 border-l border-slate-200 pl-4 space-y-2">
            {node.children?.map((c: any) => (
              <TreeNode
                key={c.site_id}
                node={c}
                onSelect={onSelect}
                onEdit={onEdit}
                onDelete={onDelete}
                isSelected={isSelected && selectedNode?.site_id === c.site_id}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  const loadSite = async () => {
    setLoading(true);
    setError("");

    try {
      const siteRes = await api.get(`/api/admin/sites/${siteId}`);
      const siteData = siteRes.data.data;
      setSite(siteData);
      setForm({
        name: siteData.name || "",
        address: siteData.address || "",
        image_url: siteData.image_url || "",
      });

      const userRes = await api.get(`/api/admin/sites/${siteId}/users`);
      setUsers(Array.isArray(userRes.data.data) ? userRes.data.data : []);

      const treeRes = await api.get(`/api/admin/sites/${siteId}/tree`);
      const treeData = buildTree(treeRes.data.data);
      setTree(treeData);
    } catch (err) {
      console.error(err);
      setError("Cannot load site or devices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const authToken = localStorage.getItem("adminToken");
    setToken(authToken);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!siteId || !token) return;
    loadSite();
  }, [siteId, token]);

  const handleEditNode = async () => {
    if (!editingNode || !editForm.name.trim()) return;

    setUpdatingNode(true);
    try {
      await api.put(`/api/admin/nodes/${editingNode.site_id}`, {
        name: editForm.name,
      });

      setShowEditModal(false);
      setEditingNode(null);
      await loadSite();
    } catch (err) {
      console.error(err);
      alert("Update failed");
    } finally {
      setUpdatingNode(false);
    }
  };

  const handleDeleteNode = async () => {
    if (!deletingNode) return;

    setDeletingNodeLoading(true);
    try {
      await api.delete(`/api/admin/nodes/${deletingNode.site_id}`);
      setShowDeleteModal(false);
      setDeletingNode(null);
      await loadSite();
    } catch (err) {
      console.error(err);
      alert("Delete failed");
    } finally {
      setDeletingNodeLoading(false);
    }
  };

  const handleRemoveDevice = async (deviceId: string) => {
    if (!confirm("Remove this device from site?")) return;

    setRemovingId(deviceId);
    try {
    await api.delete(
      `/api/admin/nodes/${selectedNode.site_id}/devices/${deviceId}`
    );

      await loadSite();
    } catch (err) {
      console.error(err);
      alert("Remove device failed");
    } finally {
      setRemovingId(null);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await api.put(`/api/admin/sites/${siteId}`, form);
      setSite(data.data);
      setEditMode(false);
    } catch (err) {
      console.error(err);
      alert("Update failed");
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveUser = async (userId: string) => {
    if (!confirm("Remove this user from site?")) return;

    setRemovingUserId(userId);
    try {
      await api.delete(`/api/admin/sites/${siteId}/users/${userId}`);
      await loadSite();
    } catch (err) {
      console.error(err);
      alert("Remove user failed");
    } finally {
      setRemovingUserId(null);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this site?")) return;

    setDeleting(true);
    try {
      await api.delete(`/api/admin/sites/${siteId}`);
      router.push(`/admin/customers/${customerId}/sites`);
    } catch (err) {
      console.error(err);
      alert("Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  const handleCreateNode = async () => {
    if (!createForm.name.trim()) return;

    setCreatingNode(true);
    try {
      await api.post(`/api/admin/sites/${siteId}/nodes`, {
        name: createForm.name,
        type: createType,
        parent_id: createForm.parent_id,
      });

      setShowCreateModal(false);
      setCreateForm({ name: "", parent_id: "" });
      await loadSite();
    } catch (err) {
      console.error(err);
      alert("Create failed");
    } finally {
      setCreatingNode(false);
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
        <div className="text-slate-600">Loading site...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 p-4 max-w-2xl mx-auto mt-6">
        <p className="text-sm text-red-700">{error}</p>
      </div>
    );
  }

  if (!site) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-slate-600">Site not found</div>
      </div>
    );
  }

  const filteredDevices = selectedNode?.devices || [];
  const statusConfig = StatusBadgeMap[filteredDevices[0]?.status?.toLowerCase()] || StatusBadgeMap.pending;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* HEADER */}
      <div className="border-b border-slate-200 bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MapPin className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{site.name}</h1>
                {site.address && (
                  <p className="text-sm text-slate-500">{site.address}</p>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                onClick={() => router.back()}
              >
                Back
              </button>
             
              <button
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                onClick={handleDelete}
                disabled={deleting}
              >
                <Trash2 className="w-4 h-4" />
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {site.image_url && (
          <img
            src={site.image_url}
            alt={site.name}
            className="w-full h-64 object-cover rounded-lg mb-6 shadow-sm"
          />
        )}

        {/* THREE-COLUMN LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT COLUMN - SITE INFO + STRUCTURE */}
          <div className="lg:col-span-1 space-y-6">
            {/* SITE INFO CARD */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
              {editMode ? (
                <>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-2">
                        Name
                      </label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) =>
                          setForm({ ...form, name: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-2">
                        Address
                      </label>
                      <input
                        type="text"
                        value={form.address}
                        onChange={(e) =>
                          setForm({ ...form, address: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-2">
                        Image URL
                      </label>
                      <input
                        type="text"
                        value={form.image_url}
                        onChange={(e) =>
                          setForm({ ...form, image_url: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="flex gap-2 pt-4">
                      <button
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex-1"
                        onClick={handleSave}
                        disabled={saving}
                      >
                        <Check className="w-4 h-4" />
                        {saving ? "Saving..." : "Save"}
                      </button>
                      <button
                        className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                        onClick={() => setEditMode(false)}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-4 mb-6">
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wide">
                        Address
                      </p>
                      <p className="text-slate-900 font-medium">
                        {site.address || "-"}
                      </p>
                    </div>
            
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wide">
                        Created At
                      </p>
                      <p className="text-slate-900 font-medium">
                        {new Date(site.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <button
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    onClick={() => setEditMode(true)}
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit Info
                  </button>
                </>
              )}
            </div>

            {/* STRUCTURE SECTION */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4">
                Site Structure
              </h2>

              <div className="space-y-2 mb-4 max-h-96 overflow-y-auto">
                {tree.length === 0 ? (
                  <div className="text-center py-6 text-slate-500">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No structure yet</p>
                  </div>
                ) : (
                  tree.map((node) => (
                    <TreeNode
                      key={node.site_id}
                      node={node}
                      onSelect={setSelectedNode}
                      onEdit={() => {}}
                      onDelete={() => {}}
                      isSelected={
                        selectedNode?.site_id === node.site_id
                      }
                    />
                  ))
                )}
              </div>

              <div className="space-y-2 pt-4 border-t border-slate-200">
                <button
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  onClick={() => {
                    setCreateType("station");
                    setCreateForm({ name: "", parent_id: siteId });
                    setShowCreateModal(true);
                  }}
                >
                  <Plus className="w-4 h-4" />
                  Add Station
                </button>

                <button
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                  onClick={() => {
                    setCreateType("cluster");
                    setCreateForm({
                      name: "",
                      parent_id: selectedNode?.site_id || siteId,
                    });
                    setShowCreateModal(true);
                  }}
                >
                  <Plus className="w-4 h-4" />
                  Add Group
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN - USERS + DEVICES */}
          <div className="lg:col-span-2 space-y-6">
            {/* USERS SECTION */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-slate-900">Users</h2>
                  <button
                    className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    onClick={() =>
                      router.push(`/admin/sites/${siteId}/assign-user`)
                    }
                  >
                    <Plus className="w-4 h-4" />
                    Assign User
                  </button>
                </div>
              </div>

              {users.length === 0 ? (
                <div className="p-6 text-center">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-slate-600">No users assigned</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-3 text-left font-semibold text-slate-900">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left font-semibold text-slate-900">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left font-semibold text-slate-900">
                          Phone
                        </th>
                        <th className="px-6 py-3 text-center font-semibold text-slate-900">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {users.map((u) => (
                        <tr key={u.user_id} className="hover:bg-slate-50">
                          <td className="px-6 py-4 font-medium text-slate-900">
                            {u.name}
                          </td>
                          <td className="px-6 py-4 text-slate-700">
                            {u.email}
                          </td>
                          <td className="px-6 py-4 text-slate-700">
                            {u.phone || "-"}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button
                              className="inline-flex items-center gap-2 px-3 py-1 text-xs font-medium text-red-700 bg-red-100 rounded hover:bg-red-200 transition-colors disabled:opacity-50"
                              onClick={() => handleRemoveUser(u.user_id)}
                              disabled={removingUserId === u.user_id}
                            >
                              <Trash2 className="w-3 h-3" />
                              {removingUserId === u.user_id
                                ? "Removing..."
                                : "Remove"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* DEVICES SECTION */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-slate-900">Devices</h2>
                  <button
                    className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    onClick={() => {
  if (!selectedNode) {
    alert("Please select a node first");
    return;
  }

  router.push(
    `/admin/sites/${siteId}/assign-device?nodeId=${selectedNode.site_id}&nodeName=${encodeURIComponent(selectedNode.name)}`
  );
}}
                  >
                    <Plus className="w-4 h-4" />
                    Assign Device
                  </button>
                </div>
              </div>

              {!selectedNode ? (
                <div className="p-8 text-center">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-slate-600">
                    Select a station or cluster from the structure
                  </p>
                </div>
              ) : filteredDevices.length === 0 ? (
                <div className="p-8 text-center">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-slate-600">No devices assigned</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-3 text-left font-semibold text-slate-900">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left font-semibold text-slate-900">
                          Serial
                        </th>
                        <th className="px-6 py-3 text-left font-semibold text-slate-900">
                          IP Address
                        </th>
                        <th className="px-6 py-3 text-left font-semibold text-slate-900">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left font-semibold text-slate-900">
                          Model
                        </th>
                        <th className="px-6 py-3 text-center font-semibold text-slate-900">
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-200">
                      {filteredDevices.map((d: Device) => {
                        const status = StatusBadgeMap[
                          d.status?.toLowerCase()
                        ] || StatusBadgeMap.pending;
                        return (
                          <tr key={d.device_id} className="hover:bg-slate-50">
                            <td className="px-6 py-4 font-medium text-slate-900">
                              {d.name}
                            </td>
                            <td className="px-6 py-4 text-slate-700 font-mono text-xs">
                              {d.serial_number}
                            </td>
                            <td className="px-6 py-4 text-slate-700 font-mono text-xs">
                              {d.ip_address || "-"}
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${status.bg} ${status.text}`}
                              >
                                <span
                                  className={`w-2 h-2 rounded-full ${status.dot}`}
                                />
                                {d.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-slate-700 text-xs">
                              {d.model}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <button
                                className="inline-flex items-center gap-2 px-3 py-1 text-xs font-medium text-red-700 bg-red-100 rounded hover:bg-red-200 transition-colors disabled:opacity-50"
                                onClick={() =>
                                  handleRemoveDevice(d.device_id)
                                }
                                disabled={removingId === d.device_id}
                              >
                                <Trash2 className="w-3 h-3" />
                                {removingId === d.device_id
                                  ? "Removing..."
                                  : "Remove"}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* CREATE NODE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-900">
                Create New {createType === "station" ? "Station" : "Cluster"}
              </h2>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  placeholder={`Enter ${createType} name`}
                  value={createForm.name}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>

              <div className="bg-slate-50 p-3 rounded-lg">
                <p className="text-xs text-slate-600 uppercase tracking-wide">
                  Parent
                </p>
                <p className="text-slate-900 font-medium text-sm">
                  {createForm.parent_id === siteId
                    ? site?.name
                    : selectedNode?.name || "Site"}
                </p>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-200 flex gap-3 justify-end">
              <button
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                onClick={() => {
                  setShowCreateModal(false);
                  setCreateForm({ name: "", parent_id: "" });
                }}
              >
                Cancel
              </button>

              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleCreateNode}
                disabled={creatingNode || !createForm.name.trim()}
              >
                {creatingNode ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT NODE MODAL */}
      {showEditModal && editingNode && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-900">
                Edit {editingNode.type === "station" ? "Station" : "Cluster"}
              </h2>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-200 flex gap-3 justify-end">
              <button
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingNode(null);
                }}
              >
                Cancel
              </button>

              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleEditNode}
                disabled={updatingNode || !editForm.name.trim()}
              >
                {updatingNode ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE NODE MODAL */}
      {showDeleteModal && deletingNode && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-900">
                Delete{" "}
                {deletingNode.type === "station" ? "Station" : "Cluster"}
              </h2>
            </div>

            <div className="p-6">
              <p className="text-slate-700">
                Are you sure you want to delete{" "}
                <span className="font-semibold">{deletingNode.name}</span>? This
                action cannot be undone.
              </p>
            </div>

            <div className="px-6 py-4 border-t border-slate-200 flex gap-3 justify-end">
              <button
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletingNode(null);
                }}
              >
                Cancel
              </button>

              <button
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleDeleteNode}
                disabled={deletingNodeLoading}
              >
                {deletingNodeLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
