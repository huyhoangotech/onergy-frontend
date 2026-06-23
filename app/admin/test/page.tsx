"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

/* ================= TYPES ================= */
type Device = {
device_id: string;
device_name: string;
serial_number: string;
};

type Bit = {
register: string;
value: number;
};

type ScanResult = {
register: number | string;
raw?: number;
bits?: Bit[];
error?: boolean;
message?: string;
};

export default function DeviceLiveScanPage() {
const [devices, setDevices] = useState<Device[]>([]);
const [deviceId, setDeviceId] = useState("");

const [start, setStart] = useState("2000");
const [end, setEnd] = useState("2100");

const [loading, setLoading] = useState(false);
const [error, setError] = useState("");

const [results, setResults] = useState<ScanResult[]>([]);

// 👉 mode switch
const [mode, setMode] = useState<"raw" | "bit">("raw");

/* ================= LOAD DEVICES ================= */
const loadDevices = async () => {
try {
const { data } = await api.get("/api/admin/devices");

  const normalized = data.map((d: any) => ({
    device_id: d.device_id,
    device_name: d.device_name,
    serial_number: d.serial_number,
  }));

  setDevices(normalized);
} catch (err) {
  console.error(err);
  setError("Failed to load devices");
}

};

useEffect(() => {
loadDevices();
}, []);

/* ================= RUN SCAN ================= */
const runScan = async () => {
setError("");
setResults([]);
if (!deviceId) {
  setError("Please select a device");
  return;
}

const s = Number(start);
const e = Number(end);

if (isNaN(s) || isNaN(e) || e < s) {
  setError("Invalid register range");
  return;
}

if (e - s > 500) {
  setError("Register range too large (max 500)");
  return;
}

try {
  setLoading(true);

  const { data } = await api.post(
    `/api/admin/devices/${deviceId}/live-scan`,
    { start: s, end: e }
  );

  console.log("API:", data);

  const registers = data.data?.registers || [];
  const bits = data.data?.bits || [];

  // map bits → register
  const bitMap: Record<number, Bit[]> = {};

  bits.forEach((b: any) => {
    const [reg] = b.register.split(".");
    const regNum = Number(reg);

    if (!bitMap[regNum]) bitMap[regNum] = [];
    bitMap[regNum].push(b);
  });

  // merge lại
  const merged: ScanResult[] = registers.map((r: any) => ({
    register: r.register,
    raw: r.value,
    bits: bitMap[r.register] || [],
  }));

  setResults(merged);
} catch (err: any) {
  console.error(err);
  setError("Live scan failed");
} finally {
  setLoading(false);
}


};

/* ================= HELPER ================= */
const getBitValue = (r: ScanResult, index: number) => {
const found = r.bits?.find(
(b) => b.register === `${r.register}.${index}`
);
return found ? found.value : 0;
};


/* ================= UI ================= */
return ( <div className="p-6 text-black"> <h1 className="text-2xl font-bold mb-6">
Device Live Modbus Scan </h1>
  {/* CONTROL PANEL */}
  <div className="bg-white border rounded-lg p-4 mb-6">
    <div className="grid grid-cols-5 gap-4 items-end">

      {/* DEVICE */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Device
        </label>
        <select
          className="w-full p-2 border rounded text-sm"
          value={deviceId}
          onChange={(e) => setDeviceId(e.target.value)}
        >
          <option value="">-- Select device --</option>
          {devices.map((d) => (
            <option key={d.device_id} value={d.device_id}>
              {d.device_name} ({d.serial_number})
            </option>
          ))}
        </select>
      </div>

      {/* START */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Start
        </label>
        <input
          type="number"
          className="w-full p-2 border rounded text-sm"
          value={start}
          onChange={(e) => setStart(e.target.value)}
        />
      </div>

      {/* END */}
      <div>
        <label className="block text-sm font-medium mb-1">
          End
        </label>
        <input
          type="number"
          className="w-full p-2 border rounded text-sm"
          value={end}
          onChange={(e) => setEnd(e.target.value)}
        />
      </div>

      {/* MODE */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Mode
        </label>
        <div className="flex gap-2">
          <button
            onClick={() => setMode("raw")}
            className={`px-3 py-1 rounded text-sm ${
              mode === "raw"
                ? "bg-blue-600 text-white"
                : "bg-gray-200"
            }`}
          >
            RAW
          </button>

          <button
            onClick={() => setMode("bit")}
            className={`px-3 py-1 rounded text-sm ${
              mode === "bit"
                ? "bg-blue-600 text-white"
                : "bg-gray-200"
            }`}
          >
            BIT
          </button>
        </div>
      </div>

      {/* RUN */}
      <button
        onClick={runScan}
        disabled={loading}
        className="h-[42px] bg-green-600 text-white rounded text-sm font-semibold hover:bg-green-700 disabled:opacity-50"
      >
        {loading ? "Running..." : "RUN"}
      </button>
    </div>

    {error && (
      <p className="text-red-500 text-sm mt-3">{error}</p>
    )}
  </div>

  {/* RESULT */}
  <div className="bg-white border rounded-lg overflow-hidden">
    <table className="w-full text-sm">
      <thead className="bg-gray-100">
        <tr>
          <th className="p-3 border">Register</th>
          <th className="p-3 border">Value</th>
          <th className="p-3 border">Status</th>
        </tr>
      </thead>
      <tbody>
        {results.length === 0 && !loading && (
          <tr>
            <td colSpan={3} className="p-4 text-center text-gray-500">
              No data
            </td>
          </tr>
        )}

        {results.map((r, idx) => (
          <tr key={idx}>
            <td className="p-2 border">{r.register}</td>

            {/* VALUE */}
            <td className="p-2 border">
              {r.error ? (
                "-"
              ) : mode === "raw" ? (
                r.raw ?? "-"
              ) : (
                <div className="flex flex-wrap gap-1">
                  {Array.from({ length: 16 }).map((_, i) => {
                    const val = getBitValue(r, i);

                    return (
                      <span
                        key={i}
                        className={`px-1 text-xs rounded ${
                          val === 1
                            ? "bg-red-500 text-white"
                            : "bg-gray-200"
                        }`}
                      >
                        {val}
                      </span>
                    );
                  })}
                </div>
              )}
            </td>

            {/* STATUS */}
            <td className="p-2 border">
          {r.error ? (
  <span className="text-red-600">
    ❌ {r.message}
  </span>
) : (
  <span className="text-green-600">OK</span>
)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>
);
}
