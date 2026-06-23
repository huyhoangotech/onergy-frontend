"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api} from "@/lib/api";
export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setError("");

  try {
    const { data } = await api.post("/api/admin/login-admin", {
      email,
      password,
    });

    // lưu admin + token
    localStorage.setItem("admin", JSON.stringify(data.admin));
    localStorage.setItem("adminToken", data.token);

    // 🔥 ÉP ĐỔI MẬT KHẨU LẦN ĐẦU
    if (data.admin.is_first_login) {
      router.push("/admin/change-password");
    } else {
      router.push("/admin/home_admin");
    }
  } catch (err: any) {
    setError(
      err.response?.data?.error ||
      err.response?.data?.message ||
      "Đăng nhập thất bại"
    );
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen bg-white flex items-center justify-center text-black">
      <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-4">Đăng Nhập Admin</h2>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}

        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-semibold mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full p-3 border border-gray-400 rounded-md bg-white text-black"
              placeholder="Email admin"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="password" className="block text-sm font-semibold mb-2">
              Mật khẩu
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full p-3 border border-gray-400 rounded-md bg-white text-black"
              placeholder="Mật khẩu admin"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white p-3 rounded-md font-semibold hover:bg-gray-800"
          >
            {loading ? "Đang đăng nhập..." : "Đăng Nhập"}
          </button>
        </form>
      </div>
    </div>
  );
}
