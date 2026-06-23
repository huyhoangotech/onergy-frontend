"use client";
import { api } from "@/lib/api";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AddAdminPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "manager",
    image_url: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("adminToken")
      : null;

  /* ================= SUBMIT ================= */
  const handleSubmit = async () => {
    if (!form.name || !form.email ) {
      setError("Name, email and are required");
      return;
    }

    setLoading(true);
    setError("");

    try {
    await api.post("/api/admin/accounts", form);

    router.push("/admin/accounts");
    } catch (err) {
      console.error(err);
      setError("Cannot create admin account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-xl text-black">
      <h1 className="text-2xl font-bold mb-6">Add Admin Account</h1>

      {error && <p className="mb-4 text-red-600">{error}</p>}

      <div className="bg-white border rounded-lg shadow p-6 space-y-4">
        <div>
          <label className="block font-medium mb-1">Name *</label>
          <input
            className="w-full p-2 border rounded"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Email *</label>
          <input
            type="email"
            className="w-full p-2 border rounded"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Role</label>
          <select
            className="w-full p-2 border rounded"
            value={form.role}
            onChange={(e) =>
              setForm({
                ...form,
                role: e.target.value,
              })
            }
          >
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
          </select>
        </div>

        <div>
          <label className="block font-medium mb-1">Image URL</label>
          <input
            className="w-full p-2 border rounded"
            value={form.image_url}
            onChange={(e) =>
              setForm({ ...form, image_url: e.target.value })
            }
          />
        </div>

        <div className="flex gap-2 pt-2">
          <button
            className="px-4 py-2 bg-black text-white rounded"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Creating..." : "Create"}
          </button>

          <button
            className="px-4 py-2 border rounded"
            onClick={() => router.back()}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
