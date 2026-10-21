'use client';

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";

type User = {
  user_id: string;
  name: string;
  email: string;
};

export default function AssignUserPage() {
  const { siteId } = useParams<{ siteId: string }>();
  const router = useRouter();

  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // 🔥 load user list
  const loadUsers = async () => {
    try {
      const res = await api.get(`/api/admin/sites/${siteId}/available-users`);
      setUsers(res.data.data || []);
    } catch (err) {
      console.error(err);
      alert("Load users failed");
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // 🔥 assign user → site
  const handleAssign = async () => {
    if (!selectedUser) {
      alert("Please select a user");
      return;
    }

    try {
      setLoading(true);

      await api.post(`/api/admin/sites/${siteId}/assign-user`, {
        user_id: selectedUser,
      });

      alert("User assigned successfully");
      router.back();
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.error || "Assign failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-xl text-black">
      <h1 className="text-2xl font-bold mb-4">Assign User to Site</h1>

      <div className="bg-white border rounded-lg p-4 space-y-2">
        {users.map((u) => (
          <div
            key={u.user_id}
            onClick={() => setSelectedUser(u.user_id)}
            className={`p-3 border rounded cursor-pointer ${
              selectedUser === u.user_id
                ? "bg-blue-500 text-white"
                : "hover:bg-gray-100"
            }`}
          >
            <p className="font-medium">{u.name}</p>
            <p className="text-sm">{u.email}</p>
          </div>
        ))}
      </div>

      <button
        className="mt-4 px-4 py-2 bg-green-600 text-white rounded"
        onClick={handleAssign}
        disabled={loading}
      >
        {loading ? "Assigning..." : "Assign User"}
      </button>
    </div>
  );
}