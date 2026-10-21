"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";

interface FormState {
  name: string;
  site_id: string;
  protocol_code: string;
  connection_config: Record<string, any>;
}

export default function EditGatewayPage() {
const params = useParams();

const gatewayId = Array.isArray(params.gatewayId)
  ? params.gatewayId[0]
  : params.gatewayId;
console.log("params =", params);
console.log("gatewayId =", params.gatewayId);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [gateway, setGateway] = useState<any>(null);

  const [sites, setSites] = useState<any[]>([]);
  const [siteNodes, setSiteNodes] = useState<any[]>([]);
  const [protocols, setProtocols] = useState<any[]>([]);
  const [schema, setSchema] = useState<any>(null);

  const [form, setForm] = useState<FormState>({
    name: "",
    site_id: "",
    protocol_code: "",
    connection_config: {},
  });

useEffect(() => {
      console.log("effect id =", gatewayId);

 if (!gatewayId) return;

  loadData();
}, [gatewayId]);

  const loadData = async () => {
      if (!gatewayId) return;

    try {
        setLoading(true);
        
      const [
        
        gatewayRes,
        sitesRes,
        protocolsRes,
      ] = await Promise.all([
        api.get(`/api/admin/gateways/${gatewayId}`),
        api.get("/api/admin/sites"),
        api.get("/api/admin/protocol-types"),
      ]);

      const gateway = gatewayRes.data;

      setGateway(gateway);

      setSites(sitesRes.data.data || []);

      setProtocols(protocolsRes.data || []);

     setForm({
  name: gateway.name || "",
  site_id: gateway.site_id || "",
  protocol_code: gateway.protocol_code || "",
  connection_config: gateway.connection_config || {},
});

if (gateway.protocol_code) {
  await loadProtocolSchema(
    gateway.protocol_code
  );
}
      await loadProtocolSchema(
        gateway.protocol_code
      );

      await loadSiteNodes(
        gateway.site_id
      );

    } catch (err) {
      console.error(err);
      alert("Cannot load gateway");
    } finally {
      setLoading(false);
    }
  };

  const loadProtocolSchema = async (
    code: string
  ) => {
    try {
      const res = await api.get(
        `/api/admin/protocol-types/${code}`
      );

      setSchema(res.data.schema_json);

    } catch (err) {
      console.error(err);
    }
  };

  const loadSiteNodes = async (
    siteId: string
  ) => {
    try {
      const res = await api.get(
        `/api/admin/sites/${siteId}/tree`
      );

      const nodes = res.data.data.filter(
        (x: any) =>
          ["site", "station", "group"]
            .includes(x.type)
      );

      const uniqueNodes = [
        ...new Map(
          nodes.map((x: any) => [
            x.site_id,
            x,
          ])
        ).values(),
      ];

      setSiteNodes(uniqueNodes);

    } catch (err) {
      console.error(err);
    }
  };

  const handleProtocolChange =
    async (code: string) => {

      setForm({
        ...form,
        protocol_code: code,
        connection_config: {},
      });

      await loadProtocolSchema(code);
    };

  const handleSave = async () => {

    try {

      setSaving(true);

      await api.put(
        `/api/admin/gateways/${gatewayId}`,
        form
      );

      alert("Gateway updated");

      router.push(
        "/admin/gateways"
      );

    } catch (err) {

      console.error(err);

      alert(
        "Failed to update gateway"
      );

    } finally {

      setSaving(false);

    }
  };

  if (loading) {
    return (
      <div className="p-8">
        Loading...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-8">

      <h1 className="text-2xl font-bold mb-6">
        Edit Gateway
      </h1>

      <div className="bg-white border rounded-xl p-6 space-y-5">

        {/* NAME */}
        <div>
          <label className="block mb-2">
            Gateway Name
          </label>

          <input
            className="w-full border rounded-lg px-4 py-2"
            value={form.name}
            onChange={(e) =>
              setForm({
                ...form,
                name: e.target.value,
              })
            }
          />
        </div>

        {/* SITE */}
        <div>
          <label className="block mb-2">
            Site
          </label>

          <select
            value={form.site_id}
            onChange={async (e) => {

              setForm({
                ...form,
                site_id:
                  e.target.value,
              });

              await loadSiteNodes(
                e.target.value
              );

            }}
            className="w-full border rounded-lg px-4 py-2"
          >
            <option value="">
              Select Site
            </option>

            {sites.map((site) => (
              <option
                key={site.site_id}
                value={site.site_id}
              >
                {site.name}
              </option>
            ))}
          </select>
        </div>

        {/* NODE */}
        <div>
          <label className="block mb-2">
            Assign Node
          </label>

          <select
            value={String(
              form.connection_config.node_id || ""
            )}
            onChange={(e) =>
              setForm({
                ...form,
                connection_config: {
                  ...form.connection_config,
                  node_id:
                    e.target.value,
                },
              })
            }
            className="w-full border rounded-lg px-4 py-2"
          >
            <option value="">
              Select Node
            </option>

            {siteNodes.map(
              (node: any) => (
                <option
                  key={node.site_id}
                  value={
                    String(node.site_id)
                  }
                >
                  {`[${node.type}] ${node.name}`}
                </option>
              )
            )}
          </select>
        </div>

        {/* PROTOCOL */}
        <div>
          <label className="block mb-2">
            Protocol
          </label>

          <select
           value={form.protocol_code || ""}
  onChange={(e) =>
              handleProtocolChange(
                e.target.value
              )
            }
            className="w-full border rounded-lg px-4 py-2"
          >
            <option value="">
              Select Protocol
            </option>

            {protocols.map(
              (p: any) => (
                <option
                  key={p.code}
                  value={p.code}
                >
                  {p.name}
                </option>
              )
            )}
          </select>
        </div>

        {/* CONFIG */}
        <div>

          <h3 className="font-semibold mb-3">
            Connection Config
          </h3>

          {schema?.fields?.map(
            (field: any) => (
              <div
                key={field.key}
                className="mb-4"
              >
                <label className="block mb-2">
                  {field.label}
                </label>

                <input
                  type={
                    field.type ===
                    "number"
                      ? "number"
                      : "text"
                  }
                  value={String(
                    form.connection_config[
                      field.key
                    ] ?? ""
                  )}
                  onChange={(
                    e
                  ) =>
                    setForm({
                      ...form,
                      connection_config:
                        {
                          ...form.connection_config,
                          [field.key]:
                            field.type ===
                            "number"
                              ? Number(
                                  e.target
                                    .value
                                )
                              : e.target
                                  .value,
                        },
                    })
                  }
                  className="w-full border rounded-lg px-4 py-2"
                />
              </div>
            )
          )}

        </div>

        <div className="flex gap-3">

          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg"
          >
            {saving
              ? "Saving..."
              : "Save"}
          </button>

          <button
            onClick={() =>
              router.back()
            }
            className="px-6 py-2 border rounded-lg"
          >
            Cancel
          </button>

        </div>

      </div>

    </div>
  );
}
