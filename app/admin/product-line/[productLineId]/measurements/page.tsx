"use client";

import { api } from "@/lib/api";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
ArrowLeft,
Loader,
AlertCircle,
Edit2,
Trash2,
Check,
X
} from "lucide-react";

/* ================= TYPES ================= */
type MeasurementModbus = {
product_line_modbus_id: string;
measurement_id: string;
measurement_code: string;
measurement_name: string;
measurement_unit?: string | null;
modbus_address?: string | number | null;
data_type?: string | null;
};

type ProductLine = {
product_line_id: string;
code: string;
name: string;
manufacturer?: string;
};

const DATA_TYPE_OPTIONS = [
"UTF8",
"INT16",
"INT16U",
"INT32",
"INT32U",
"INT64",
"FLOAT32",
"FLOAT64",
];

/* ================= PAGE ================= */
export default function ProductLineMeasurementsPage() {
const params = useParams();
const router = useRouter();
const productLineId = params.productLineId as string;

const [productLine, setProductLine] = useState<ProductLine | null>(null);
const [data, setData] = useState<MeasurementModbus[]>([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState("");

const [editId, setEditId] = useState<string | null>(null);
const [editValue, setEditValue] = useState<string>("");
const [editDataType, setEditDataType] = useState<string>("");

/* ================= LOAD PRODUCT LINE ================= */
const loadProductLine = async () => {
if (!productLineId) return;


try {
  const { data } = await api.get<ProductLine[]>("/api/admin/product-lines");

  const found = data.find(
    (p) => p.product_line_id === productLineId
  );

  setProductLine(found || null);
} catch {
  setProductLine(null);
}


};

/* ================= LOAD MEASUREMENTS ================= */
const loadData = async () => {
if (!productLineId) return;


setLoading(true);
setError("");

try {
  const res = await api.get(
    `/api/admin/product-lines/${productLineId}/measurements`
  );

  const rows: MeasurementModbus[] = (res.data || []).map((item: any) => ({
    ...item,
    data_type: item.data_type || "",
  }));

  setData(rows);
} catch (err: any) {
  setError(err.response?.data?.message || "Cannot load measurements");
  setData([]);
} finally {
  setLoading(false);
}


};

/* ================= EDIT MODBUS ================= */
const saveModbus = async (id: string) => {
try {
await api.put(
`/api/admin/product-lines/${productLineId}/measurements/${id}`,
{
modbus_address:
editValue.trim() === "" ? null : Number(editValue),
data_type: editDataType || null,
}
);


  setEditId(null);
  setEditValue("");
  setEditDataType("");
  loadData();
} catch (err: any) {
  setError(err.response?.data?.message || "Cannot save modbus mapping");
}


};

/* ================= DELETE MODBUS ================= */
const deleteModbus = async (id: string) => {
if (!confirm("Delete this modbus mapping?")) return;


try {
  await api.delete(
    `/api/admin/product-lines/${productLineId}/measurements/${id}`
  );
  loadData();
} catch (err: any) {
  setError(err.response?.data?.message || "Cannot delete modbus mapping");
}


};

useEffect(() => {
loadProductLine();
loadData();
}, [productLineId]);

/* ================= RENDER ================= */
return ( <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
{/* HEADER */} <div className="border-b border-slate-200 bg-white shadow-sm sticky top-0 z-40"> <div className="max-w-7xl mx-auto px-4 py-5 sm:px-6 lg:px-8"> <div className="flex items-center gap-4">
<button
onClick={() => router.back()}
className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
title="Go back"
> <ArrowLeft className="w-5 h-5 text-slate-600" /> </button> <div> <h1 className="text-2xl font-bold text-slate-900">
Modbus Mapping </h1> <p className="text-sm text-slate-500 mt-1">
{productLine?.name || "Product Line"} </p> </div> </div> </div> </div>


  {/* MAIN CONTENT */}
  <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader className="w-6 h-6 text-blue-600 animate-spin" />
        </div>
      )}

      {error && (
        <div className="m-6 flex items-center gap-3 text-red-600 bg-red-50 p-4 rounded-lg">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {!loading && data.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="w-12 h-12 text-slate-300 mb-4" />
          <p className="text-slate-600 font-medium">No measurements assigned</p>
          <p className="text-sm text-slate-500 mt-1">
            Add measurements from device type configuration
          </p>
        </div>
      )}

      {!loading && data.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-slate-700">
                  Code
                </th>
                <th className="px-6 py-3 text-left font-semibold text-slate-700">
                  Name
                </th>
                <th className="px-6 py-3 text-left font-semibold text-slate-700">
                  Unit
                </th>
                <th className="px-6 py-3 text-left font-semibold text-slate-700">
                  Modbus Address
                </th>
                <th className="px-6 py-3 text-left font-semibold text-slate-700">
                  Data Type
                </th>
                <th className="px-6 py-3 text-center font-semibold text-slate-700">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200">
              {data.map((m) => (
                <tr
                  key={m.product_line_modbus_id}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="px-6 py-4 font-mono text-xs text-slate-600">
                    {m.measurement_code}
                  </td>

                  <td className="px-6 py-4 font-medium text-slate-900">
                    {m.measurement_name}
                  </td>

                  <td className="px-6 py-4 text-slate-600">
                    {m.measurement_unit || "-"}
                  </td>

                  {/* MODBUS ADDRESS */}
                  <td className="px-6 py-4">
                    {editId === m.product_line_modbus_id ? (
                      <input
                        className="px-3 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        autoFocus
                        placeholder="Enter modbus address"
                      />
                    ) : (
                      <span className="text-slate-900">
                        {m.modbus_address ?? "-"}
                      </span>
                    )}
                  </td>

                  {/* DATA TYPE */}
                  <td className="px-6 py-4">
                    {editId === m.product_line_modbus_id ? (
                      <select
                        className="px-3 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                        value={editDataType}
                        onChange={(e) => setEditDataType(e.target.value)}
                      >
                        <option value="">-- Select type --</option>
                        {DATA_TYPE_OPTIONS.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-slate-900">
                        {m.data_type || "-"}
                      </span>
                    )}
                  </td>

                  {/* ACTIONS */}
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {editId === m.product_line_modbus_id ? (
                        <>
                          <button
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                            onClick={() =>
                              saveModbus(m.product_line_modbus_id)
                            }
                            title="Save"
                          >
                            <Check className="w-4 h-4" />
                          </button>

                          <button
                            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded transition-colors"
                            onClick={() => {
                              setEditId(null);
                              setEditValue("");
                              setEditDataType("");
                            }}
                            title="Cancel"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="p-1.5 text-slate-600 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors"
                            onClick={() => {
                              setEditId(m.product_line_modbus_id);
                              setEditValue(
                                m.modbus_address !== null &&
                                  m.modbus_address !== undefined
                                  ? String(m.modbus_address)
                                  : ""
                              );
                              setEditDataType(m.data_type || "");
                            }}
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            className="p-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            onClick={() =>
                              deleteModbus(m.product_line_modbus_id)
                            }
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  </div>
</div>
);
}
