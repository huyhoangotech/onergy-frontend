"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function CreateStationPage() {
  const { siteId } = useParams<{ siteId: string }>();
  const router = useRouter();

  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name) return alert("Enter station name");

    setLoading(true);
    try {
      await api.post(`/api/admin/sites/${siteId}/stations`, {
        name,
      });

      router.push(`/admin/sites/${siteId}`);
    } catch (err) {
      console.error(err);
      alert("Create failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-10">
      <h1 className="text-xl font-bold mb-4">Create Station</h1>

      <input
        type="text"
        placeholder="Station name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full border px-3 py-2 rounded mb-4"
      />

      <button
        onClick={handleCreate}
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 rounded"
      >
        {loading ? "Creating..." : "Create"}
      </button>
    </div>
  );
}