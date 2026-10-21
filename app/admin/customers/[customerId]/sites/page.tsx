"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
type Customer = {
  customer_id: string;
  name: string;
  code: string;
};

type Site = {
  site_id: string;
  name: string;
  address: string | null;
  image_url: string | null;
  created_at: string;
};

export default function CustomerSitesPage() {
  const { customerId } = useParams<{ customerId: string }>();
  const router = useRouter();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("adminToken")
      : null;

  /* ===== LOAD CUSTOMER ===== */
 const loadCustomer = async () => {
  try {
    const { data } = await api.get(
      `/api/admin/customers/${customerId}`
    );

    setCustomer(data);
  } catch (err) {
    console.error(err);
    setError("Load customer failed");
  }
};


  /* ===== LOAD SITES ===== */
  const loadSites = async () => {
  try {
    const { data } = await api.get(
      `/api/admin/customers/${customerId}/sites`
    );

    setSites(Array.isArray(data?.data) ? data.data : []);
  } catch (err) {
    console.error(err);
    setError("Load sites failed");
  }
};


  useEffect(() => {
    if (customerId) {
      setLoading(true);
      Promise.all([loadCustomer(), loadSites()]).finally(() =>
        setLoading(false)
      );
    }
  }, [customerId]);

  /* ================= UI ================= */
  return (
    <div className="p-6 text-black">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          Sites of {customer?.name || "..."}
        </h1>

        <button
          className="px-4 py-2 bg-black text-white rounded"
          onClick={() =>
            router.push(`/admin/customers/${customerId}/sites/new`)
          }
        >
          + Add Site
        </button>
      </div>

      {loading && (
        <p className="text-sm text-gray-500">Loading sites...</p>
      )}

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {!loading && !error && (
        <>
          {sites.length === 0 ? (
            <p className="text-sm text-gray-500">
              No sites found
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sites.map((site) => (
                <div
                  key={site.site_id}
                  className="border rounded-lg p-4 bg-white shadow hover:shadow-md cursor-pointer"
                  onClick={() =>
                    router.push(`/admin/sites/${site.site_id}`)
                  }
                >
                  <h2 className="font-semibold text-lg mb-1">
                    {site.name}
                  </h2>

                  <p className="text-sm text-gray-600 mb-2">
                    {site.address || "No address"}
                  </p>

                  <p className="text-xs text-gray-400">
                    Created:{" "}
                    {new Date(site.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
