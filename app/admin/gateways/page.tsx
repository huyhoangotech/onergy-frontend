"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Wifi, Plus, Eye, Edit2, Trash2, Check, X } from "lucide-react";

type Gateway = {
  gateway_id: string;
  name: string;

  protocol_code: string;

  connection_config: Record<string, any>;

  site_id: string;
  site_name: string;

  status: number | null;

  created_at: string;
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
const [protocols, setProtocols] = useState<any[]>([]);

const [schema, setSchema] = useState<any>(null);

const [config, setConfig] =
  useState<Record<string, any>>({});


  const [saving, setSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
const [siteNodes,setSiteNodes] = useState<any[]>([]);
 const [newGateway, setNewGateway] = useState({
  name: "",
  site_id: "",
  protocol_code: "",
});
  const [creating, setCreating] = useState(false);
  const [sites, setSites] = useState<Site[]>([]);
const loadProtocols = async () => {
  try {
    const { data } =
      await api.get("/api/admin/protocol-types");

    setProtocols(data);

  } catch (err) {
    console.error(err);
  }
};
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
const handleSiteChange = async (
  siteId:string
) => {

  try {

    const res = await api.get(
      `/api/admin/sites/${siteId}/tree`
    );

  const nodes = res.data.data.filter(
  (x: any) =>
    ["site", "station", "group"].includes(x.type)
);

// loại bỏ site_id trùng nhau
const uniqueNodes = [
  ...new Map(
    nodes.map((x: any) => [x.site_id, x])
  ).values(),
];

setSiteNodes(uniqueNodes);


  } catch(err){
    console.error(err);
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
      loadProtocols();
  }, [token]);
const handleProtocolChange = async (
  code: string
) => {

  try {

    const res = await api.get(
      `/api/admin/protocol-types/${code}`
    );

    setSchema(res.data.schema_json);

    const defaults: any = {};

    res.data.schema_json.fields.forEach(
      (f: any) => {

        if (f.default !== undefined) {
          defaults[f.key] = f.default;
        }

      }
    );
    setConfig(defaults);

  } catch (err) {
    console.error(err);
  }

};
  const handleCreateGateway = async () => {
    setCreating(true);
    try {
      const { data } = await api.post("/api/admin/gateways", {
        name: newGateway.name,
        site_id: newGateway.site_id,
        protocol_code: newGateway.protocol_code,
        connection_config: config,
      });

      setGateways((prev) => [data, ...prev]);
      setShowAddForm(false);
      setNewGateway({
        name: "",
        site_id: "",
        protocol_code: "",
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
 <div className="mb-6 w-full max-w-lg  p-6 bg-white rounded-xl border border-slate-200 shadow-sm space-y-4">
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
            </div>

           <select
  onChange={(e) => {
    setNewGateway({
      ...newGateway,
      site_id: "",
    });

    handleSiteChange(e.target.value);
  }}
  className="w-full px-4 py-2 border rounded-lg"
>
  <option value="">
    Select Site
  </option>

  {sites.map((site) => (
    <option
      key={site.site_id}
      value={site.site_id}
    >
      {site.name}
    </option>
  ))}
</select>
<select
  value={newGateway.site_id}
  onChange={(e) =>
    setNewGateway({
      ...newGateway,
      site_id: e.target.value,
    })
  }
  className="w-full px-4 py-2 border rounded-lg"
>
  <option value="">
    Select Node
  </option>

  {siteNodes.map((node) => (
    <option
      key={node.site_id}
      value={node.site_id}
    >
      [{node.type}] {node.name}
    </option>
  ))}
</select>
<select
  value={newGateway.protocol_code}
  onChange={(e) => {
    setNewGateway({
      ...newGateway,
      protocol_code: e.target.value,
    });

    handleProtocolChange(
      e.target.value
    );
  }}
  className="w-full px-4 py-2 border rounded-lg"
>
  <option value="">
    Select Protocol
  </option>

  {protocols.map((p: any) => (
    <option
      key={p.code}
      value={p.code}
    >
      {p.name}
    </option>
  ))}
</select>
{schema?.fields?.map(
  (field: any) => (
    <div
      key={field.key}
      className="space-y-1"
    >
      <label className="text-sm font-medium">
        {field.label}
      </label>

      <input
        type={
          field.type === "number"
            ? "number"
            : "text"
        }
        value={
          config[field.key] ?? ""
        }
        onChange={(e) =>
          setConfig({
            ...config,
            [field.key]:
              field.type === "number"
                ? Number(
                    e.target.value
                  )
                : e.target.value,
          })
        }
        className="w-full px-4 py-2 border rounded-lg"
      />
    </div>
  )
)}
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
                 
                      <th className="px-6 py-3 text-left font-semibold text-slate-900">Protocol</th>
                      <th className="px-6 py-3 text-left font-semibold text-slate-900">Status</th>
                      <th className="px-6 py-3 text-left font-semibold text-slate-900">Created</th>
                      <th className="px-6 py-3 text-center font-semibold text-slate-900">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-200">
                    {gateways.map((g) => (
                     <tr
  key={g.gateway_id}
  className="hover:bg-slate-50"
>
  <td className="px-6 py-4 font-medium">
    {g.name}
  </td>

  <td className="px-6 py-4">
    {g.site_name}
  </td>

  <td className="px-6 py-4 text-sm">
    {g.protocol_code}
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

  <td className="px-6 py-4">
    {new Date(
      g.created_at
    ).toLocaleDateString()}
  </td>

  <td className="px-6 py-4 text-center">
    <div className="flex gap-2 justify-center">

      <button
        onClick={() =>
          router.push(
            `/admin/gateways/${g.gateway_id}`
          )
        }
        className="p-2 rounded-lg bg-blue-100 text-blue-600"
      >
        <Eye className="w-4 h-4" />
      </button>

    <button
  onClick={() =>
    router.push(
      `/admin/gateways/${g.gateway_id}/edit`
    )
  }
  className="p-2 rounded-lg bg-cyan-100 text-cyan-600 hover:bg-cyan-200 transition-colors"
  title="Edit"
>
  <Edit2 className="w-4 h-4" />
</button>

      <button
        onClick={() =>
          handleDeleteGateway(
            g.gateway_id
          )
        }
        className="p-2 rounded-lg bg-red-100 text-red-600"
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
        )}
          </>
        )}
      </div>
    </div>
  );
}
