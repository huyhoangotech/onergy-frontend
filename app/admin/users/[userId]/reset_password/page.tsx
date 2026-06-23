"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { api } from "@/lib/api";
import { Lock, ArrowLeft, Loader2 } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.userId as string;

  const [token, setToken] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const authToken = localStorage.getItem("adminToken");
    setToken(authToken);
    setMounted(true);
    if (!authToken) {
      router.replace("/404");
    }
  }, [router]);

  const handleReset = async () => {
    setError("");

    if (!newPassword || !confirmPassword) {
      setError("Please fill in both fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      await api.put(`/api/admin/users/${userId}/reset_password`, {
        newPassword,
      });

      alert("Password reset successfully!");
      router.push("/admin/users");
    } catch (err: any) {
      console.error("Reset password error:", err);
      setError(
        err.response?.data?.message || "Reset password failed"
      );
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* HEADER */}
      <div className="border-b border-slate-200 bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-md mx-auto px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
              <Lock className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Reset Password</h1>
              <p className="text-sm text-slate-500">Set a new password for the user</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-8 sm:px-6">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="bg-white rounded-lg shadow-sm p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setError("");
                }}
                placeholder="Enter new password"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-slate-900"
              />
              <p className="mt-1 text-xs text-slate-500">
                At least 6 characters
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setError("");
                }}
                placeholder="Confirm new password"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-slate-900"
              />
            </div>
          </div>

          {/* Reset Button */}
          <button
            onClick={handleReset}
            disabled={loading}
            className="mt-6 w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors font-medium"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Resetting...
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                Reset Password
              </>
            )}
          </button>

          <p className="mt-4 text-xs text-slate-500 text-center">
            Make sure to save this password securely for the user
          </p>
        </div>
      </div>
    </div>
  );
}
