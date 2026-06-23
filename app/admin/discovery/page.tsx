"use client";

import { useEffect, useState } from "react";

export default function DeviceDiscoveryPage() {
  const [publicIP, setPublicIP] = useState("");
 const [localIPs, setLocalIPs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  // ======================
  // GET PUBLIC IP
  // ======================
  async function getPublicIP() {
    try {
      const res = await fetch("https://api.ipify.org?format=json");
      const data = await res.json();
      return data.ip;
    } catch {
      return null;
    }
  }

  // ======================
  // WEBRTC LOCAL IP (best effort)
  // ======================
 async function getLocalIPs(): Promise<string[]> {
  return new Promise((resolve) => {
    const ips: string[] = [];

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    pc.createDataChannel("");

    pc.onicecandidate = (event) => {
      if (!event.candidate) return;
 console.log("ICE:", event.candidate.candidate);
      const match = event.candidate.candidate.match(
        /(\d+\.\d+\.\d+\.\d+)/
      );

      if (match) {
        ips.push(match[1]);
      }
    };

    pc.createOffer()
      .then((offer) => pc.setLocalDescription(offer))
      .catch(() => {});

    setTimeout(() => {
      pc.close();
      resolve(ips);
    }, 1500);
  });
}

  // ======================
  // SEND TO BACKEND
  // ======================
 async function sendDiscovery(
  publicIp: string | null,
  localIps: string[]
) {
    try {
      await fetch("https://be.otech.vn/api/admin/device/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          device_id: "WEB_TEST_DEVICE",
          public_ip: publicIp,
          local_ips: localIps,
        }),
      });

      setStatus("✅ Sent to backend successfully");
    } catch (err) {
      setStatus("❌ Failed to send");
    }
  }

  // ======================
  // RUN DISCOVERY
  // ======================
  async function runDiscovery() {
    setLoading(true);
    setStatus("Scanning...");

    const pub = await getPublicIP();
    const local = await getLocalIPs();

    setPublicIP(pub);
    setLocalIPs(local);

    await sendDiscovery(pub, local);

    setLoading(false);
  }

  useEffect(() => {
    runDiscovery();
  }, []);

  return (
    <div className="p-6 ml-64 text-black">
      <h1 className="text-2xl font-bold mb-4">
        🔍 Device Discovery Test (Synology-like)
      </h1>

      <button
        onClick={runDiscovery}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        {loading ? "Scanning..." : "Rescan"}
      </button>

      <div className="mt-6 space-y-3">
        <div>
          <b>Public IP:</b> {publicIP || "..."}
        </div>

        <div>
          <b>Local IPs (WebRTC):</b>
          <ul className="list-disc ml-6">
            {localIPs.length > 0 ? (
              localIPs.map((ip, i) => <li key={i}>{ip}</li>)
            ) : (
              <li>Not detected</li>
            )}
          </ul>
        </div>

        <div className="mt-4 text-green-600 font-bold">
          {status}
        </div>
      </div>
    </div>
  );
}