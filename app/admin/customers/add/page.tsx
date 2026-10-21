"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function AddCustomerPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    code: "",
    address: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("adminToken")
      : null;

  /* ================= SUBMIT ================= */
  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setError("");

  try {
    await api.post("/api/admin/customers", form);

    router.push("/admin/customers");
  } catch (err: any) {
    console.error(err);
    setError(
      err?.response?.data?.message || "Cannot create customer"
    );
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="p-6 text-black max-w-xl">
      <h1 className="text-2xl font-bold mb-6">Add Customer</h1>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      <form
        onSubmit={handleSubmit}
        className="bg-white border rounded-lg shadow-sm p-6 space-y-4"
      >
        {/* NAME */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Customer Name
          </label>
          <input
            required
            className="w-full p-2 border rounded"
            value={form.name}
            onChange={(e) =>
              setForm({ ...form, name: e.target.value })
            }
          />
        </div>

        {/* CODE */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Customer Code
          </label>
          <input
            required
            className="w-full p-2 border rounded"
            placeholder="VD: CUST_HCM_01"
            value={form.code}
            onChange={(e) =>
              setForm({ ...form, code: e.target.value })
            }
          />
        </div>

        {/* ADDRESS */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Address
          </label>
          <textarea
            className="w-full p-2 border rounded"
            rows={3}
            value={form.address}
            onChange={(e) =>
              setForm({ ...form, address: e.target.value })
            }
          />
        </div>

        {/* ACTIONS */}
        <div className="flex justify-end gap-2 pt-4">
          <button
            type="button"
            className="px-4 py-2 border rounded"
            onClick={() => router.back()}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="px-4 py-2 bg-black text-white rounded"
            disabled={loading}
          >
            {loading ? "Saving..." : "Create"}
          </button>
        </div>
      </form>
    </div>
  );
}
