"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
export default function AddUserPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    company: "",
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
  if (!form.name || !form.email || !form.password) {
    setError("Name, email and password are required");
    return;
  }

  setLoading(true);
  setError("");

  try {
    await api.post("/api/admin/users", form);
    router.push("/admin/users");
  } catch (err) {
    console.error(err);
    setError("Cannot create user");
  } finally {
    setLoading(false);
  }
};


  /* ================= UI ================= */
  return (
    <div className="p-6 max-w-xl text-black">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Add User</h1>
        <button
          className="px-4 py-2 border rounded"
          onClick={() => router.back()}
        >
          Back
        </button>
      </div>

      <div className="bg-white border rounded-lg shadow p-6 space-y-4">
        {error && <p className="text-sm text-red-600">{error}</p>}

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
          <label className="block font-medium mb-1">Password *</label>
          <input
            type="password"
            className="w-full p-2 border rounded"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Phone</label>
          <input
            className="w-full p-2 border rounded"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Address</label>
          <input
            className="w-full p-2 border rounded"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Company</label>
          <input
            className="w-full p-2 border rounded"
            value={form.company}
            onChange={(e) => setForm({ ...form, company: e.target.value })}
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Image URL</label>
          <input
            className="w-full p-2 border rounded"
            value={form.image_url}
            onChange={(e) => setForm({ ...form, image_url: e.target.value })}
          />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <button
            className="px-4 py-2 border rounded"
            onClick={() => router.back()}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 bg-black text-white rounded"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Creating..." : "Create User"}
          </button>
        </div>
      </div>
    </div>
  );
}
