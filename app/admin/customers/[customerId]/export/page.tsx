
"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Download,
  FileSpreadsheet,
  Loader,
  CalendarDays,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

/* ================= TYPES ================= */

type ExportType = "week" | "month" | "year" | "custom";

type Device = {
  device_id: string;
  name: string;
  is_using_storage?: boolean;
  path?: string;
};

type Measurement = {
  measurement_id: string;
  name: string;
  unit?: string;
};

/* ================= DATE HELPERS ================= */

const pad = (value: number) => String(value).padStart(2, "0");

const formatDateInput = (date: Date) => {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}`;
};

const startOfDay = (date: Date) => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
};

const endOfDay = (date: Date) => {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
};

/**
 * Week = Monday -> Sunday
 */
const getWeekRange = (dateString: string) => {
  const selected = new Date(`${dateString}T00:00:00`);

  const day = selected.getDay();

  // JS:
  // Sunday = 0
  // Monday = 1
  // ...
  const diffToMonday = day === 0 ? -6 : 1 - day;

  const monday = new Date(selected);
  monday.setDate(selected.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return {
    from: monday,
    to: sunday,
  };
};

const getMonthRange = (year: number, month: number) => {
  const from = new Date(year, month, 1);
  from.setHours(0, 0, 0, 0);

  const to = new Date(year, month + 1, 0);
  to.setHours(23, 59, 59, 999);

  return {
    from,
    to,
  };
};

const getYearRange = (year: number) => {
  const from = new Date(year, 0, 1);
  from.setHours(0, 0, 0, 0);

  const to = new Date(year, 11, 31);
  to.setHours(23, 59, 59, 999);

  return {
    from,
    to,
  };
};

/* ================= COMPONENT ================= */

export default function AdminExportPage() {
  const { customerId } = useParams<{ customerId: string }>();

  /* ================= STATE ================= */

  const [devices, setDevices] = useState<Device[]>([]);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);

  const [selectedDevice, setSelectedDevice] = useState("");

  const [exportType, setExportType] =
    useState<ExportType>("month");

  const now = new Date();

  const [weekDate, setWeekDate] = useState(
    formatDateInput(now)
  );

  const [selectedYear, setSelectedYear] = useState(
    now.getFullYear()
  );

  const [selectedMonth, setSelectedMonth] = useState(
    now.getMonth()
  );

  const [customFrom, setCustomFrom] = useState(
    formatDateInput(
      new Date(now.getFullYear(), now.getMonth(), 1)
    )
  );

  const [customTo, setCustomTo] = useState(
    formatDateInput(now)
  );

  const [loadingDevices, setLoadingDevices] =
    useState(false);

  const [loadingMeasurements, setLoadingMeasurements] =
    useState(false);

  const [exporting, setExporting] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  /* ================= LOAD DEVICES ================= */

  useEffect(() => {
    if (!customerId) return;

    loadDevices();
  }, [customerId]);

  const loadDevices = async () => {
    try {
      setLoadingDevices(true);
      setError("");

      const res = await api.get(
        `/api/admin/customers/${customerId}/devices`
      );

      const data: Device[] =
        res.data?.data ?? [];

      const sorted = [...data].sort(
        (a, b) =>
          Number(b.is_using_storage) -
          Number(a.is_using_storage)
      );

      setDevices(sorted);

      if (sorted.length > 0) {
        setSelectedDevice(sorted[0].device_id);
      }
    } catch (err) {
      console.error("Load devices error:", err);

      setError(
        "Unable to load devices. Please try again."
      );
    } finally {
      setLoadingDevices(false);
    }
  };

  /* ================= LOAD MEASUREMENTS ================= */

  useEffect(() => {
    if (!selectedDevice) {
      setMeasurements([]);
      return;
    }

    loadMeasurements();
  }, [selectedDevice]);

  const loadMeasurements = async () => {
    try {
      setLoadingMeasurements(true);
      setError("");

      const res = await api.get(
        `/api/admin/devices/${selectedDevice}/measurements`
      );

      setMeasurements(
        res.data?.data ?? []
      );
    } catch (err) {
      console.error(
        "Load measurements error:",
        err
      );

      setMeasurements([]);

      setError(
        "Unable to load device measurements."
      );
    } finally {
      setLoadingMeasurements(false);
    }
  };

  /* ================= DEVICE GROUPING ================= */

  const groupedDevices = useMemo(() => {
    return devices.reduce(
      (acc, device) => {
        const siteName =
          device.path?.split(" > ")[0] ??
          "Unknown Site";

        if (!acc[siteName]) {
          acc[siteName] = [];
        }

        acc[siteName].push(device);

        return acc;
      },
      {} as Record<string, Device[]>
    );
  }, [devices]);

  /* ================= RANGE ================= */

  const selectedRange = useMemo(() => {
    let from: Date;
    let to: Date;

    if (exportType === "week") {
      const range = getWeekRange(weekDate);

      from = range.from;
      to = range.to;
    } else if (exportType === "month") {
      const range = getMonthRange(
        selectedYear,
        selectedMonth
      );

      from = range.from;
      to = range.to;
    } else if (exportType === "year") {
      const range = getYearRange(selectedYear);

      from = range.from;
      to = range.to;
    } else {
      from = startOfDay(
        new Date(`${customFrom}T00:00:00`)
      );

      to = endOfDay(
        new Date(`${customTo}T00:00:00`)
      );
    }

    return {
      from,
      to,
    };
  }, [
    exportType,
    weekDate,
    selectedYear,
    selectedMonth,
    customFrom,
    customTo,
  ]);

  /* ================= RANGE LABEL ================= */

  const rangeLabel = useMemo(() => {
    const from = selectedRange.from;
    const to = selectedRange.to;

    return `${from.toLocaleDateString("vi-VN")} → ${to.toLocaleDateString(
      "vi-VN"
    )}`;
  }, [selectedRange]);

  /* ================= EXPORT ================= */

  const handleExport = async () => {
    if (!selectedDevice) {
      setError("Please select a device.");
      return;
    }

    if (
      exportType === "custom" &&
      selectedRange.from >= selectedRange.to
    ) {
      setError(
        "The end date must be after the start date."
      );
      return;
    }

    try {
      setExporting(true);
      setError("");
      setSuccess("");

      const response = await api.get(
        `/api/admin/devices/${selectedDevice}/export-history`,
        {
          params: {
            type: exportType,
            from: selectedRange.from.getTime(),
            to: selectedRange.to.getTime(),
          },

          responseType: "blob",
        }
      );

      /*
       * Try to get filename from Content-Disposition.
       */
      let filename =
        "measurement-export.xlsx";

      const disposition =
        response.headers?.["content-disposition"];

      if (disposition) {
        const match =
          disposition.match(
            /filename\*?=(?:UTF-8'')?["']?([^;"']+)["']?/i
          );

        if (match?.[1]) {
          filename = decodeURIComponent(
            match[1]
          );
        }
      }

      /*
       * Download blob
       */
      const blob = new Blob(
        [response.data],
        {
          type:
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }
      );

      const url =
        window.URL.createObjectURL(blob);

      const link =
        document.createElement("a");

      link.href = url;
      link.download = filename;

      document.body.appendChild(link);

      link.click();

      link.remove();

      window.URL.revokeObjectURL(url);

      setSuccess(
        "Excel file exported successfully."
      );
    } catch (err: any) {
      console.error(
        "Export measurement error:",
        err
      );

      /*
       * Axios returns the backend error as Blob
       * when responseType = blob.
       */
      let message =
        "Failed to export data.";

      try {
        if (
          err?.response?.data instanceof Blob
        ) {
          const text =
            await err.response.data.text();

          const json =
            JSON.parse(text);

          if (json?.message) {
            message = json.message;
          }
        } else if (
          err?.response?.data?.message
        ) {
          message =
            err.response.data.message;
        }
      } catch {
        // Ignore parsing error
      }

      setError(message);
    } finally {
      setExporting(false);
    }
  };

  /* ================= MONTHS ================= */

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const years = Array.from(
    { length: 7 },
    (_, index) =>
      now.getFullYear() - 5 + index
  );

  /* ================= UI ================= */

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* ================= HEADER ================= */}

      <div className="border-b border-slate-200 bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() =>
                window.history.back()
              }
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              title="Go back"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-100 rounded-lg">
                <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Export Data
                </h1>

                <p className="text-sm text-slate-500 mt-1">
                  Export device measurements to Excel
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================= MAIN ================= */}

      <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* ================= SETTINGS ================= */}

        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-6">
            <Download className="w-5 h-5 text-slate-600" />

            <h2 className="text-lg font-bold text-slate-900">
              Export Settings
            </h2>
          </div>

          <div className="space-y-7">
            {/* ================= DEVICE ================= */}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Select Device
              </label>

              {loadingDevices ? (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Loader className="w-4 h-4 animate-spin" />
                  Loading devices...
                </div>
              ) : (
                <select
                  value={selectedDevice}
                  onChange={(e) => {
                    setSelectedDevice(
                      e.target.value
                    );
                    setSuccess("");
                    setError("");
                  }}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                >
                  <option value="">
                    -- Choose device --
                  </option>

                  {Object.entries(
                    groupedDevices
                  ).map(
                    ([siteName, siteDevices]) => (
                      <optgroup
                        key={siteName}
                        label={siteName}
                      >
                        {siteDevices.map(
                          (device) => (
                            <option
                              key={
                                device.device_id
                              }
                              value={
                                device.device_id
                              }
                            >
                              {device.name}
                            </option>
                          )
                        )}
                      </optgroup>
                    )
                  )}
                </select>
              )}
            </div>

            {/* ================= MEASUREMENT INFO ================= */}

            {selectedDevice && (
              <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" />

                  <div>
                    <p className="text-sm font-semibold text-emerald-900">
                      All measurements will be exported
                    </p>

                    <p className="text-sm text-emerald-700 mt-1">
                      {loadingMeasurements ? (
                        "Loading measurements..."
                      ) : (
                        <>
                          This device has{" "}
                          <strong>
                            {measurements.length}
                          </strong>{" "}
                          configured measurement
                          {measurements.length !== 1
                            ? "s"
                            : ""}
                          .
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ================= EXPORT TYPE ================= */}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Export Period
              </label>

              <div className="flex flex-wrap gap-2">
                {[
                  {
                    type: "week" as ExportType,
                    label: "Week",
                  },
                  {
                    type: "month" as ExportType,
                    label: "Month",
                  },
                  {
                    type: "year" as ExportType,
                    label: "Year",
                  },
                  {
                    type: "custom" as ExportType,
                    label: "Custom",
                  },
                ].map((item) => (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => {
                      setExportType(
                        item.type
                      );
                      setError("");
                      setSuccess("");
                    }}
                    className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      exportType === item.type
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ================= WEEK ================= */}

            {exportType === "week" && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Select a date
                </label>

                <div className="relative">
                  <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />

                  <input
                    type="date"
                    value={weekDate}
                    onChange={(e) =>
                      setWeekDate(
                        e.target.value
                      )
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>
              </div>
            )}

            {/* ================= MONTH ================= */}

            {exportType === "month" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Year
                  </label>

                  <select
                    value={selectedYear}
                    onChange={(e) =>
                      setSelectedYear(
                        Number(e.target.value)
                      )
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  >
                    {years.map((year) => (
                      <option
                        key={year}
                        value={year}
                      >
                        {year}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">
                    Month
                  </label>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {months.map(
                      (month, index) => (
                        <button
                          key={month}
                          type="button"
                          onClick={() =>
                            setSelectedMonth(
                              index
                            )
                          }
                          className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                            selectedMonth ===
                            index
                              ? "bg-emerald-600 text-white"
                              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                          }`}
                        >
                          {month}
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ================= YEAR ================= */}

            {exportType === "year" && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Year
                </label>

                <select
                  value={selectedYear}
                  onChange={(e) =>
                    setSelectedYear(
                      Number(e.target.value)
                    )
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                >
                  {years.map((year) => (
                    <option
                      key={year}
                      value={year}
                    >
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* ================= CUSTOM ================= */}

            {exportType === "custom" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    From
                  </label>

                  <input
                    type="date"
                    value={customFrom}
                    onChange={(e) =>
                      setCustomFrom(
                        e.target.value
                      )
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    To
                  </label>

                  <input
                    type="date"
                    value={customTo}
                    onChange={(e) =>
                      setCustomTo(
                        e.target.value
                      )
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>
              </div>
            )}

            {/* ================= RANGE PREVIEW ================= */}

            <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Selected range
              </p>

              <p className="text-base font-semibold text-slate-900 mt-1">
                {rangeLabel}
              </p>

              <p className="text-xs text-slate-500 mt-1">
                The backend will automatically group
                data according to the selected export
                period.
              </p>
            </div>

            {/* ================= ERROR ================= */}

            {error && (
              <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />

                <p className="text-sm text-red-700">
                  {error}
                </p>
              </div>
            )}

            {/* ================= SUCCESS ================= */}

            {success && (
              <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" />

                <p className="text-sm text-emerald-700">
                  {success}
                </p>
              </div>
            )}

            {/* ================= EXPORT BUTTON ================= */}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleExport}
                disabled={
                  !selectedDevice ||
                  exporting ||
                  loadingMeasurements ||
                  measurements.length === 0
                }
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {exporting ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Export Excel
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

