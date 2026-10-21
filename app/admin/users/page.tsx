"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import {
  AlertCircle,
  Building2,
  ChevronLeft,
  ChevronRight,
  Edit2,
  KeyRound,
  Loader,
  Mail,
  Phone,
  Search,
  Trash2,
  Users,
} from "lucide-react";

type User = {
  user_id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  customer_name: string | null;
  image_url: string | null;
  created_at: string;
};

const PAGE_SIZE = 6;

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!localStorage.getItem("adminToken")) router.replace("/404");
  }, [router]);

  const loadUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/api/admin/users");
      setUsers(Array.isArray(data.data) ? data.data : []);
    } catch (err) {
      console.error("Load users error:", err);
      setError("Không thể tải danh sách người dùng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return users;
    return users.filter((user) =>
      [user.name, user.email, user.phone, user.customer_name, user.company]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword)),
    );
  }, [search, users]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const visibleUsers = filteredUsers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const firstItem = filteredUsers.length ? (page - 1) * PAGE_SIZE + 1 : 0;
  const lastItem = Math.min(page * PAGE_SIZE, filteredUsers.length);

  useEffect(() => setPage(1), [search]);

  const handleDelete = async (userId: string) => {
    if (!confirm("Bạn có chắc muốn xóa người dùng này không?")) return;
    try {
      const { data } = await api.delete(`/api/admin/users/${userId}`);
      if (!data.success) return alert(data.message);
      alert(data.message);
      loadUsers();
    } catch (err) {
      console.error("Delete user error:", err);
      alert("Đã xảy ra lỗi không mong muốn");
    }
  };

  return (
    <main className="min-h-screen bg-[#f4f7fa] px-4 py-5 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-[1450px] flex-col gap-5">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-white text-slate-700 shadow-[0_5px_18px_rgba(15,23,42,0.08)] ring-1 ring-slate-200">
              <Users aria-hidden="true" className="size-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-[28px]">User Manager</h1>
              <p className="mt-1 text-sm text-slate-500">Tổng: {users.length} người dùng</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm">
              <Users aria-hidden="true" className="mr-2 inline size-4" /> Tài khoản
            </div>
          </div>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_8px_28px_rgba(15,23,42,0.08)] sm:p-4">
          <label className="flex h-11 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/70 px-4 text-sm text-slate-400 focus-within:border-slate-400 focus-within:bg-white">
            <Search aria-hidden="true" className="size-4" />
            <span className="sr-only">Tìm kiếm người dùng</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm kiếm theo tên, email, số điện thoại hoặc khách hàng..."
              className="min-w-0 flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
            />
          </label>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.1)]">
          {loading && <div className="flex items-center justify-center py-20"><Loader aria-label="Đang tải" className="size-7 animate-spin text-slate-500" /></div>}
          {error && <div className="m-5 flex items-center gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-700"><AlertCircle className="size-5" />{error}</div>}
          {!loading && !error && filteredUsers.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-20 text-center text-slate-500"><Users className="size-12 text-slate-300" /><p>{users.length ? "Không tìm thấy người dùng phù hợp" : "Chưa có người dùng"}</p></div>
          )}
          {!loading && !error && visibleUsers.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-sm">
                <thead className="bg-[#dbe4ec] text-slate-800">
                  <tr>
                    {['Người dùng','Email','Số điện thoại','Khách hàng','Ngày tạo','Thao tác'].map((heading, index) => <th key={heading} className={`px-5 py-3.5 text-left font-semibold ${index === 5 ? 'text-center' : ''}`}>{heading}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {visibleUsers.map((user, index) => (
                    <tr key={user.user_id} className={`border-t border-slate-200 transition hover:bg-slate-50 ${index % 2 ? 'bg-slate-50/50' : 'bg-white'}`}>
                      <td className="px-5 py-3.5"><div className="flex items-center gap-3"><div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100 font-semibold text-slate-600">{user.image_url ? <img src={`http://localhost:5000${user.image_url}`} alt={user.name} className="size-full object-cover" crossOrigin="anonymous" /> : user.name.charAt(0).toUpperCase()}</div><span className="font-semibold text-slate-800">{user.name}</span></div></td>
                      <td className="px-5 py-3.5 text-slate-600"><span className="inline-flex items-center gap-2"><Mail className="size-4 text-slate-400" />{user.email}</span></td>
                      <td className="px-5 py-3.5 text-slate-600"><span className="inline-flex items-center gap-2"><Phone className="size-4 text-slate-400" />{user.phone || '-'}</span></td>
                      <td className="px-5 py-3.5 text-slate-600"><span className="inline-flex items-center gap-2"><Building2 className="size-4 text-slate-400" />{user.customer_name || user.company || '-'}</span></td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-slate-600">{new Date(user.created_at).toLocaleDateString('vi-VN')}</td>
                      <td className="px-5 py-3.5"><div className="flex items-center justify-center gap-2"><button type="button" onClick={() => router.push(`/admin/users/${user.user_id}`)} title="Chỉnh sửa" className="flex size-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-[0_3px_8px_rgba(15,23,42,0.12)] transition hover:-translate-y-0.5 hover:border-blue-300 hover:text-blue-600"><Edit2 className="size-4" /></button><button type="button" onClick={() => router.push(`/admin/users/${user.user_id}/reset_password`)} title="Đặt lại mật khẩu" className="flex size-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-[0_3px_8px_rgba(15,23,42,0.12)] transition hover:-translate-y-0.5 hover:border-emerald-300 hover:text-emerald-600"><KeyRound className="size-4" /></button><button type="button" onClick={() => handleDelete(user.user_id)} title="Xóa" className="flex size-9 items-center justify-center rounded-lg border border-red-100 bg-red-50 text-red-600 shadow-[0_3px_8px_rgba(15,23,42,0.1)] transition hover:-translate-y-0.5 hover:bg-red-100"><Trash2 className="size-4" /></button></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {!loading && filteredUsers.length > 0 && <footer className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between"><span>Hiển thị <strong className="text-slate-700">{firstItem} - {lastItem}</strong> trên <strong className="text-slate-700">{filteredUsers.length}</strong> người dùng</span><div className="flex items-center gap-2"><button type="button" aria-label="Trang trước" disabled={page === 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="flex size-9 items-center justify-center rounded-lg border border-slate-200 bg-white shadow-sm transition hover:bg-slate-50 disabled:opacity-40"><ChevronLeft className="size-4" /></button><span className="flex size-9 items-center justify-center rounded-lg bg-slate-800 font-semibold text-white">{page}</span><button type="button" aria-label="Trang sau" disabled={page === totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))} className="flex size-9 items-center justify-center rounded-lg border border-slate-200 bg-white shadow-sm transition hover:bg-slate-50 disabled:opacity-40"><ChevronRight className="size-4" /></button></div></footer>}
        </section>
      </div>
    </main>
  );
}


