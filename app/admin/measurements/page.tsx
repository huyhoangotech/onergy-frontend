"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import {
  Loader,
  AlertCircle,
  Edit2,
  Trash2,
  Plus,
  ChevronDown,
  ChevronRight,
  Ruler,
  Check,
  X,
} from "lucide-react";

type Measurement = {
  measurement_id: string;
  code: string;
  name: string;
  unit: string | null;
  description: string | null;
  parent_id: string | null;
  children?: Measurement[];
};

export default function MeasurementsPage() {
  const [tree, setTree] = useState<Measurement[]>([]);
  const [flat, setFlat] = useState<Measurement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Measurement | null>(null);

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [token, setToken] = useState<string | null>(null);

  const [form, setForm] = useState<any>({
    code: "",
    name: "",
    unit: "",
    description: "",
    parent_id: "",
  });

  const loadMeasurements = async () => {
    setLoading(true);
    try {
      const { data } = await api.get<{
        measurements: Measurement[];
        flat: Measurement[];
      }>("/api/admin/measurements");

      if (!Array.isArray(data.measurements) || !Array.isArray(data.flat)) {
        setTree([]);
        setFlat([]);
        return;
      }

      setTree(data.measurements);
      setFlat(data.flat);

      const expandMap: Record<string, boolean> = {};
      data.flat.forEach((m) => {
        expandMap[m.measurement_id] = true;
      });
      setExpanded(expandMap);
    } catch {
      setError("Cannot load measurements");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const authToken = localStorage.getItem("adminToken");
    setToken(authToken);
  }, []);

  useEffect(() => {
    if (!token) return;
    loadMeasurements();
  }, [token]);

  const openAdd = () => {
    setEditing(null);
    setForm({
      code: "",
      name: "",
      unit: "",
      description: "",
      parent_id: "",
    });
    setShowModal(true);
  };

  const openEdit = (m: Measurement) => {
    setEditing(m);
    setForm({
      code: m.code,
      name: m.name,
      unit: m.unit || "",
      description: m.description || "",
      parent_id: m.parent_id || "",
    });
    setShowModal(true);
  };

  const save = async () => {
    setError("");
    const payload = {
      code: form.code,
      name: form.name,
      unit: form.unit || null,
      description: form.description || null,
      parent_id: form.parent_id || null,
    };

    try {
      if (editing) {
        await api.put(
          `/api/admin/measurements/${editing.measurement_id}`,
          payload
        );
      } else {
        await api.post("/api/admin/measurements", payload);
      }

      setShowModal(false);
      loadMeasurements();
    } catch (err: any) {
      setError(err.response?.data?.message || "Save failed");
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this measurement?")) return;

    try {
      await api.delete(`/api/admin/measurements/${id}`);
      loadMeasurements();
    } catch (err) {
      console.error(err);
      alert("Delete failed");
    }
  };

  const toggleExpand = (id: string) => {
    setExpanded((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const renderRow = (m: Measurement, level: number) => {
    const hasChildren = m.children && m.children.length > 0;
    if (!token) {
      return null;
    }

    return (
      <div
        key={m.measurement_id}
        className="flex items-center border-b border-slate-200 py-3 px-6 hover:bg-slate-50 transition-colors group"
        style={{ paddingLeft: `${24 + level * 20}px` }}
      >
        <div className="w-5 flex-shrink-0">
          {hasChildren && (
            <button
              onClick={() => toggleExpand(m.measurement_id)}
              className="text-slate-600 hover:text-slate-900 transition-colors p-0.5"
            >
              {expanded[m.measurement_id] ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          )}
        </div>

        <div className="flex-1 ml-2">
          <div className="font-medium text-slate-900">{m.name}</div>
          <div className="text-xs text-slate-500 mt-0.5">
            {m.code} {m.unit ? `(${m.unit})` : ""}
          </div>
        </div>

        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => openEdit(m)}
            className="p-1.5 text-slate-600 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors"
            title="Edit"
          >
            <Edit2 className="w-4 h-4" />
          </button>

          <button
            onClick={() => remove(m.measurement_id)}
            className="p-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  const renderTree = (m: Measurement, level = 0) => {
    return (
      <div key={m.measurement_id}>
        {renderRow(m, level)}

        {expanded[m.measurement_id] &&
          m.children?.map((c) => renderTree(c, level + 1))}
      </div>
    );
  };

  const buildParentOptions = (
    nodes: Measurement[],
    level = 0,
    result: any[] = []
  ) => {
    nodes.forEach((n) => {
      if (!editing || n.measurement_id !== editing.measurement_id) {
        result.push({
          id: n.measurement_id,
          label: `${"— ".repeat(level)}${n.name}`,
        });
      }

      if (n.children?.length) {
        buildParentOptions(n.children, level + 1, result);
      }
    });
    return result;
  };

  const parentOptions = buildParentOptions(tree);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* HEADER */}
      <div className="border-b border-slate-200 bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-5 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-100 rounded-lg">
              <Ruler className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Measurements</h1>
              <p className="text-sm text-slate-500 mt-1">Manage measurement units and hierarchy</p>
            </div>
          </div>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Measurement
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

          {!loading && !error && tree.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Ruler className="w-12 h-12 text-slate-300 mb-4" />
              <p className="text-slate-600 font-medium">No measurements found</p>
            </div>
          )}

          {!loading && !error && tree.length > 0 && (
            <div className="divide-y divide-slate-200">
              {tree.map((m) => renderTree(m, 0))}
            </div>
          )}
        </div>
      </div>

      {/* ADD/EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-lg">
            <h2 className="text-lg font-bold text-slate-900 mb-4">
              {editing ? "Edit Measurement" : "Add Measurement"}
            </h2>

            {["code", "name", "unit"].map((f) => (
              <input
                key={f}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 mb-3"
                placeholder={f.charAt(0).toUpperCase() + f.slice(1)}
                value={form[f]}
                onChange={(e) =>
                  setForm({ ...form, [f]: e.target.value })
                }
              />
            ))}

            <select
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 mb-3"
              value={form.parent_id}
              onChange={(e) =>
                setForm({ ...form, parent_id: e.target.value })
              }
            >
              <option value="">-- No parent --</option>
              {parentOptions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>

            <textarea
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 mb-4"
              placeholder="Description"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              rows={3}
            />

            {error && (
              <p className="text-red-600 text-sm mb-4">{error}</p>
            )}

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={save}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
