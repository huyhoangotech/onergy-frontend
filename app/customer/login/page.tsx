"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function CustomerLoginPage() {
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
  console.log("=== LOGIN START ===");
  console.log("EMAIL:", email);

  const { data } = await api.post(
    "/api/customer/login-customer",
    {
      email,
      password,
    }
  );

  console.log("LOGIN RESPONSE:", data);
  console.log("TOKEN FROM API:", data.token);
  console.log("USER FROM API:", data.user);

  // lưu customer + token
  localStorage.setItem(
    "customer",
    JSON.stringify(data.user)
  );

  localStorage.setItem(
    "customerToken",
    data.token
  );

  // log sau khi lưu
  console.log(
    "TOKEN AFTER SAVE:",
    localStorage.getItem("customerToken")
  );

  console.log(
    "CUSTOMER AFTER SAVE:",
    localStorage.getItem("customer")
  );

  // lần đầu đổi mật khẩu
  if (data.user.is_first_login) {
    console.log("REDIRECT TO CHANGE PASSWORD");
    router.push("/customer/change-password");
  } else {
    console.log("REDIRECT TO HOME");
    router.push("/customer/home");
  }
} catch (err: any) {
  console.error("LOGIN ERROR:", err);
  console.error(
    "LOGIN ERROR RESPONSE:",
    err.response?.data
  );

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
        <h2 className="text-2xl font-bold text-center mb-4">
          Customer Login
        </h2>

        {error && (
          <p className="text-red-500 text-center mb-4">
            {error}
          </p>
        )}

        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label
              htmlFor="email"
              className="block text-sm font-semibold mb-2"
            >
              Email
            </label>

            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              required
              className="w-full p-3 border border-gray-400 rounded-md bg-white text-black"
              placeholder="Customer email"
            />
          </div>

          <div className="mb-4">
            <label
              htmlFor="password"
              className="block text-sm font-semibold mb-2"
            >
              Password
            </label>

            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              required
              className="w-full p-3 border border-gray-400 rounded-md bg-white text-black"
              placeholder="Password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white p-3 rounded-md font-semibold hover:bg-green-700 disabled:opacity-50"
          >
            {loading
              ? "Đang đăng nhập..."
              : "Đăng nhập"}
          </button>
        </form>
      </div>
    </div>
  );
}