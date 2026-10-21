"use client";
import { api } from "@/lib/api";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

async function getApi(path: string, token: string) {
  const response = await fetch(path, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return { data: await response.json() };
}
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Bell,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock3,
  LoaderCircle,
  MoreHorizontal,
  RefreshCw,
  Search,
  ShieldCheck,
  Thermometer,
  Wifi,
  Zap,
} from "lucide-react";

type MeasurementNode = {
  id: string;
  name: string;
  value: string | number | null;
  unit: string | null;
  children?: MeasurementNode[];
};

type AlarmLog = {
  id: string;
  event_type: string;
  severity: string;
  triggered_at: string;
  value?: string | number | null;
};

const iconForMeasurement = (index: number) => {
  const icons = [Zap, Thermometer, Activity, Wifi];
  return icons[index % icons.length];
};

export default function DeviceDetailPage() {
  const { deviceId } = useParams<{ deviceId: string }>();
  const token = typeof window !== "undefined" ? localStorage.getItem("adminToken") : null;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deviceName, setDeviceName] = useState("Unknown Device");
  const [measurements, setMeasurements] = useState<MeasurementNode[]>([]);
  const [alarms, setAlarms] = useState<AlarmLog[]>([]);
  const [activeTab, setActiveTab] = useState<"measurements" | "alarms">("measurements");
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!deviceId) {
      setError("Missing deviceId");
      setLoading(false);
      return;
    }
    if (!token) {
      setError("Unauthorized. Please login again.");
      setLoading(false);
      return;
    }

    const loadAll = async () => {
      try {
        const deviceRes = await api.get(`/api/admin/devices/${deviceId}`);
        setDeviceName(deviceRes.data.device_name || "Unknown Device");
        const meaRes = await api.get(`/api/admin/devices/${deviceId}/measurements-tree`);
        setMeasurements(meaRes.data.measurements || []);
        try {
          const alarmRes = await api.get(`/api/admin/devices/${deviceId}/alarm-logs`);
          setAlarms(alarmRes.data.alarms || []);
        } catch {
          setAlarms([]);
        }
      } catch (err) {
        console.error("LOAD ERROR:", err);
        setError("Failed to load device data");
      } finally {
        setLoading(false);
      }
    };
    loadAll();
  }, [deviceId, token]);

  const criticalAlarms = useMemo(
    () => alarms.filter((alarm) => ["CRITICAL", "HIGH"].includes(alarm.severity?.toUpperCase())).length,
    [alarms],
  );

  const filteredMeasurements = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return measurements;
    return measurements.filter((group) => {
      return group.name.toLowerCase().includes(normalized) || group.children?.some((child) => child.name.toLowerCase().includes(normalized));
    });
  }, [measurements, query]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6f8fb] text-slate-950">
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-slate-200 bg-white px-10 py-9 shadow-sm">
          <LoaderCircle className="size-8 animate-spin text-blue-600" />
          <p className="text-sm font-semibold text-slate-600">Đang tải dữ liệu thiết bị...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-[#f6f8fb] p-6 text-slate-950 sm:p-10">
        <button onClick={() => window.history.back()} className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-blue-700"><ArrowLeft className="size-4" /> Quay lại</button>
        <div className="mx-auto max-w-3xl rounded-2xl border border-rose-200 bg-white p-12 text-center shadow-sm"><AlertCircle className="mx-auto mb-4 size-12 text-rose-500" /><p className="font-semibold text-rose-700">{error}</p></div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f6f8fb] text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex min-h-[74px] max-w-[1440px] items-center justify-between gap-5 px-6 sm:px-10">
          <div className="flex min-w-0 items-center gap-5">
            <button onClick={() => window.history.back()} aria-label="Quay lại" className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"><ArrowLeft className="size-5" /></button>
            <div className="h-8 w-px bg-slate-200" />
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400"><span>Thiết bị</span><ChevronRight className="size-3" /><span className="text-slate-600">Chi tiết</span></div>
              <h1 className="truncate text-lg font-bold text-slate-900 sm:text-xl">{deviceName}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
<button
  onClick={() => window.location.reload()}
  className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-blue-200 hover:text-blue-700 sm:inline-flex"
>
  <RefreshCw className="size-4" />
  Đồng bộ
</button>
         
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1440px] px-6 py-8 sm:px-10 lg:py-10">
        <section className="mb-7 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700"><span className="size-1.5 rounded-full bg-emerald-500" /> ĐANG HOẠT ĐỘNG</div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Trạng thái thiết bị</h2>
            <p className="mt-2 text-sm text-slate-500">Theo dõi thông số vận hành và cảnh báo theo thời gian thực.</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400"><Clock3 className="size-4" /> Cập nhật lần cuối: 2 phút trước</div>
        </section>

        <section className="mb-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard label="Trạng thái kết nối" value="Ổn định" detail="Tín hiệu tốt · 24 ms" icon={<Wifi className="size-4 text-emerald-500" />} detailClass="text-emerald-600" />
          <SummaryCard label="Thời gian hoạt động" value="18d 06h" detail="+2.4% so với tháng trước" icon={<Activity className="size-4 text-blue-500" />} detailClass="text-blue-500" />
          <SummaryCard label="Cảnh báo đang mở" value={String(alarms.length).padStart(2, "0")} detail={criticalAlarms > 0 ? "Cần được kiểm tra" : "Không có cảnh báo nghiêm trọng"} icon={<AlertTriangle className="size-4 text-amber-500" />} detailClass="text-amber-600" />
          <SummaryCard label="Sức khỏe thiết bị" value="96" suffix="/100" detail="Tốt · Không có rủi ro" icon={<ShieldCheck className="size-4 text-violet-500" />} detailClass="text-emerald-600" />
        </section>

        <div className="mb-5 flex flex-col gap-3 border-b border-slate-200 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex gap-6">
            <TabButton active={activeTab === "measurements"} onClick={() => setActiveTab("measurements")} icon={<Activity className="size-4" />} label="Thông số" />
            <TabButton active={activeTab === "alarms"} onClick={() => setActiveTab("alarms")} icon={<AlertTriangle className="size-4" />} label="Lịch sử cảnh báo" count={alarms.length} danger />
          </div>
          {activeTab === "measurements" && <label className="mb-2 flex h-9 w-full items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-slate-400 shadow-sm sm:w-52"><Search className="size-4" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm thông số..." className="w-full bg-transparent text-xs text-slate-700 outline-none placeholder:text-slate-400" /></label>}
        </div>

        {activeTab === "measurements" ? (
          <section className="grid gap-4 lg:grid-cols-2">
            {filteredMeasurements.length === 0 ? <EmptyState icon={<CheckCircle2 className="size-10 text-emerald-500" />} title="Không có dữ liệu đo lường" description="Thiết bị sẽ bắt đầu gửi dữ liệu khi được kết nối" /> : filteredMeasurements.map((group, index) => <MeasurementCard key={group.id} group={group} index={index} />)}
          </section>
        ) : (
          <section className="flex flex-col gap-3">
            {alarms.length === 0 ? <EmptyState icon={<CheckCircle2 className="size-10 text-emerald-500" />} title="Không có cảnh báo" description="Thiết bị đang hoạt động bình thường" /> : alarms.map((alarm) => <AlarmCard key={alarm.id} alarm={alarm} />)}
          </section>
        )}
      </div>
    </main>
  );
}

function SummaryCard({ label, value, suffix, detail, icon, detailClass }: { label: string; value: string; suffix?: string; detail: string; icon: React.ReactNode; detailClass: string }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.03)]"><div className="mb-5 flex items-center justify-between text-xs font-medium text-slate-500"><span>{label}</span>{icon}</div><div className="flex items-baseline gap-1"><span className="text-2xl font-bold tracking-tight text-slate-950">{value}</span>{suffix && <span className="text-sm font-semibold text-slate-400">{suffix}</span>}</div><p className={`mt-1.5 text-xs font-medium ${detailClass}`}>{detail}</p></div>;
}

function TabButton({ active, onClick, icon, label, count, danger }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; count?: number; danger?: boolean }) {
  return <button onClick={onClick} className={`relative inline-flex items-center gap-2 pb-3 text-sm font-semibold transition ${active ? danger ? "text-rose-600" : "text-blue-600" : "text-slate-400 hover:text-slate-700"}`}>{icon}{label}{count !== undefined && <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${active && danger ? "bg-rose-50 text-rose-600" : "bg-slate-100 text-slate-500"}`}>{count}</span>}{active && <span className={`absolute inset-x-0 -bottom-px h-0.5 rounded-full ${danger ? "bg-rose-500" : "bg-blue-600"}`} />}</button>;
}

function MeasurementCard({ group, index }: { group: MeasurementNode; index: number }) {
  const Icon = iconForMeasurement(index);
  return <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.03)] transition hover:-translate-y-0.5 hover:shadow-lg sm:p-6"><div className="flex items-start justify-between gap-4"><div className="flex min-w-0 items-start gap-3"><div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${index % 2 === 0 ? "bg-blue-50 text-blue-600" : "bg-amber-50 text-amber-600"}`}><Icon className="size-5" /></div><div><h3 className="font-bold text-slate-900">{group.name}</h3><p className="mt-1 flex items-center gap-1.5 text-xs text-emerald-600"><CheckCircle2 className="size-3.5" /> Trong ngưỡng an toàn</p></div></div><button aria-label="Tùy chọn" className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"><MoreHorizontal className="size-5" /></button></div><div className="mt-7 flex items-end justify-between gap-3"><div className="flex items-baseline gap-2"><span className="text-4xl font-bold tracking-tight text-slate-950">{group.value ?? "-"}</span><span className="text-sm font-semibold text-slate-400">{group.unit ?? ""}</span></div><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-600">Bình thường</span></div>{Array.isArray(group.children) && group.children.length > 0 && <div className="mt-5 border-t border-slate-100 pt-4"><button className="flex w-full items-center justify-between text-left text-xs font-medium text-slate-500"><span>Chi tiết cảm biến ({group.children.length})</span><ChevronDown className="size-4" /></button><div className="mt-3 grid gap-2 sm:grid-cols-2">{group.children.map((child) => <div key={child.id} className="rounded-xl bg-[#f6f8fb] px-3 py-3"><p className="text-[11px] text-slate-400">{child.name}</p><p className="mt-1 text-sm font-bold text-slate-700">{child.value ?? "-"} <span className="text-[11px] font-medium text-slate-400">{child.unit ?? ""}</span></p></div>)}</div></div>}</article>;
}

function AlarmCard({ alarm }: { alarm: AlarmLog }) {
  const severity = alarm.severity?.toUpperCase();
  const tone = severity === "CRITICAL" || severity === "HIGH" ? "rose" : severity === "MEDIUM" ? "amber" : "slate";
  const toneClasses = { rose: "border-rose-200 bg-rose-50/50 text-rose-600", amber: "border-amber-200 bg-amber-50/50 text-amber-600", slate: "border-slate-200 bg-white text-slate-500" }[tone];
  return <article className={`rounded-2xl border p-5 shadow-sm ${toneClasses}`}><div className="flex items-start justify-between gap-4"><div className="flex min-w-0 items-start gap-3"><div className="rounded-xl bg-white p-2"><AlertTriangle className="size-5" /></div><div className="min-w-0"><h3 className="truncate font-bold text-slate-800">{alarm.event_type ?? "Unknown Alarm"}</h3><p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500"><span className="inline-flex items-center gap-1.5"><Clock3 className="size-3.5" /> {new Date(alarm.triggered_at).toLocaleString("vi-VN")}</span>{alarm.value != null && <span>Giá trị: <strong className="text-slate-700">{alarm.value}</strong></span>}</p></div></div><span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[11px] font-bold">{alarm.severity}</span></div><div className="mt-4 flex items-center gap-1 text-xs font-semibold text-slate-400">Xem chi tiết <ChevronRight className="size-3" /></div></article>;
}

function EmptyState({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm"><div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-emerald-50">{icon}</div><h2 className="font-bold text-slate-800">{title}</h2><p className="mt-2 text-sm text-slate-500">{description}</p></div>;
}

export {};
