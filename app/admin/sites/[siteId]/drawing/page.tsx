"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Stage, Layer, Rect, Text, Line, Image as KonvaImage } from "react-konva";
import useImage from "use-image";
import {
  ArrowLeft,
  Save,
  Upload,
  Square,
  Type,
  MousePointer,
  Trash2,
} from "lucide-react";

import { api } from "@/lib/api";
import * as pdfjsLib from "pdfjs-dist";

// Set up PDF worker
if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
}

type DrawingObject =
  | {
      id: string;
      type: "rect";
      x: number;
      y: number;
      width: number;
      height: number;
      fill: string;
    }
  | {
      id: string;
      type: "text";
      x: number;
      y: number;
      text: string;
    };
type DrawingData = {
  background_url: string | null;
  nodes: any[];
  edges: any[];
};

function PDFBackground({
  url,
  onLoaded,
}: {
  url: string;
  onLoaded: (img: HTMLImageElement) => void;
}) {
  useEffect(() => {
    if (!url) return;

    const loadPDF = async () => {
      try {
        const PDFJS = await import("pdfjs-dist");

        PDFJS.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

        const response = await fetch(
          url.startsWith("http")
            ? url
            : `http://localhost:5000${url}`
        );

        const arrayBuffer = await response.arrayBuffer();

        const pdf = await PDFJS.getDocument({
          data: arrayBuffer,
        }).promise;

        const page = await pdf.getPage(1);

        const viewport = page.getViewport({
          scale: 2,
        });

        const canvas = document.createElement("canvas");

        const context = canvas.getContext("2d");

        if (!context) return;

        canvas.width = viewport.width;
        canvas.height = viewport.height;

     await page.render({
  canvas,
  canvasContext: context,
  viewport,
}).promise;

        const img = new window.Image();

        img.onload = () => {
          onLoaded(img);
        };

        img.src = canvas.toDataURL("image/png");
     } catch (err: any) {
  console.error("LOAD DRAWING ERROR");
  console.error(err);

  console.error("MESSAGE:", err?.message);

  console.error("RESPONSE:", err?.response);

  console.error("RESPONSE DATA:", err?.response?.data);

  console.error("STATUS:", err?.response?.status);

  console.error("STACK:", err?.stack);
}
    };

    loadPDF();
  }, [url, onLoaded]);

  return null;
}

function BackgroundImage({
  url,
  width,
  height,
}: {
  url: string;
  width: number;
  height: number;
}) {
  const [image] = useImage(url || "");

  // Nếu là hình ảnh
  if (!image) return null;

  return (
    <KonvaImage
      image={image}
      width={width}
      height={height}
    />
  );
}

export default function SiteDrawingPage() {
  const router = useRouter();

  const { siteId } = useParams<{
    siteId: string;
  }>();

  const stageRef = useRef<any>(null);

  const [loading, setLoading] = useState(true);

  const [tool, setTool] = useState<
    "select" | "rect" | "text"
  >("select");

  const [drawing, setDrawing] = useState<DrawingData>({
  background_url: null,
  nodes: [],
  edges: [],
});

  const [selectedId, setSelectedId] =
    useState<string | null>(null);

  const [saving, setSaving] = useState(false);
const [pdfImage, setPdfImage] =
  useState<HTMLImageElement | null>(null);
  useEffect(() => {
    loadDrawing();
  }, []);

 const loadDrawing = async () => {
  try {
    const res = await api.get(
      `/api/admin/sites/${siteId}/drawing`
    );

    console.log("DRAWING:", res.data);

   const data = res.data.data || {};

setDrawing({
  background_url:
    data.background_url ||
    data.backgroundUrl ||
    null,

  nodes: Array.isArray(data.objects)
    ? data.objects
    : Array.isArray(data.nodes)
    ? data.nodes
    : [],

  edges: Array.isArray(data.edges)
    ? data.edges
    : [],
});
  } catch (err) {
    console.error(err);
  } finally {
    setLoading(false);
  }
};
  const handleSave = async () => {
    setSaving(true);

    try {
      await api.put(
        `/api/admin/sites/${siteId}/drawing`,
        drawing
      );

      alert("Drawing saved");
    } catch (err) {
      console.error(err);
      alert("Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleUploadBackground = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    try {
      const formData = new FormData();

      formData.append("file", file);

      const res = await api.post(
        `/api/admin/drawings/upload-background`,
        formData,
        {
          headers: {
            "Content-Type":
              "multipart/form-data",
          },
        }
      );

      setDrawing((prev) => ({
        ...prev,
        background_url: res.data.url,
      }));
    } catch (err) {
      console.error(err);
      alert("Upload failed");
    }
  };

  const addRect = () => {
    const rect: DrawingObject = {
      id: crypto.randomUUID(),
      type: "rect",
      x: 100,
      y: 100,
      width: 120,
      height: 60,
      fill: "#3b82f6",
    };

   setDrawing((prev) => ({
  ...prev,
  nodes: [...prev.nodes, rect],
}));
};
  const addText = () => {
    const text: DrawingObject = {
      id: crypto.randomUUID(),
      type: "text",
      x: 120,
      y: 120,
      text: "Station",
    };

   setDrawing((prev) => ({
  ...prev,
 nodes: [...prev.nodes, text],
}));
};

  const removeSelected = () => {
    if (!selectedId) return;

    setDrawing((prev) => ({
  ...prev,
  nodes: prev.nodes.filter(
    (o: any) => o.id !== selectedId
  ),
}));

    setSelectedId(null);
  };

  if (loading) {
    return (
      <div className="p-8">
        Loading drawing...
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-100">
      {/* HEADER */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 border rounded-lg hover:bg-slate-50"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <h1 className="text-xl font-bold">
            Drawing Editor
          </h1>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {saving ? "Saving..." : "Save"}
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* LEFT TOOLBAR */}
        <div className="w-64 bg-white border-r border-slate-200 p-4 space-y-3">
          <h2 className="font-semibold text-slate-900">
            Tools
          </h2>

          <button
            onClick={() => {
              setTool("rect");
              addRect();
            }}
            className="w-full flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-slate-50"
          >
            <Square className="w-4 h-4" />
            Rectangle
          </button>

          <button
            onClick={() => {
              setTool("text");
              addText();
            }}
            className="w-full flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-slate-50"
          >
            <Type className="w-4 h-4" />
            Text
          </button>

          <label className="w-full flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-slate-50 cursor-pointer">
            <Upload className="w-4 h-4" />
            Upload Background

            <input
              type="file"
              className="hidden"
              onChange={handleUploadBackground}
            />
          </label>

          <button
            onClick={removeSelected}
            className="w-full flex items-center gap-2 px-4 py-2 rounded-lg border text-red-600 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
            Delete Selected
          </button>
        </div>

        {/* CANVAS */}
        <div className="flex-1 overflow-auto bg-slate-300 relative">
          {/* PDF Background - Render outside Stage */}
     {drawing.background_url &&
 drawing.background_url.toLowerCase().endsWith(".pdf") && (
  <PDFBackground
    url={drawing.background_url}
    onLoaded={setPdfImage}
  />
)}
          
          <Stage
            ref={stageRef}
            width={1600}
            height={900}
            className="bg-white"
            onMouseDown={(e) => {
              if (
                e.target === e.target.getStage()
              ) {
                setSelectedId(null);
              }
            }}
          >
          <Layer>
  {pdfImage && (
    <KonvaImage
      image={pdfImage}
      width={1600}
      height={900}
    />
  )}

  {drawing.background_url &&
    !drawing.background_url.toLowerCase().endsWith(".pdf") && (
      <BackgroundImage
        url={`http://localhost:5000${drawing.background_url}`}
        width={1600}
        height={900}
      />
  )}
     {drawing.nodes.map((obj: any) => (
  <Text
    key={obj.id}
    x={Number(obj.x) || 0}
    y={Number(obj.y) || 0}
    text={String(obj.label || obj.text || "Text")}
    fontSize={18}
    fill="#000"
    draggable
    onClick={() => setSelectedId(obj.id)}
    onDragEnd={(e) => {
      setDrawing((prev) => ({
        ...prev,
        nodes: prev.nodes.map((n: any) =>
          n.id === obj.id
            ? {
                ...n,
                x: e.target.x(),
                y: e.target.y(),
              }
            : n
        ),
      }));
    }}
  />
))}
            </Layer>
          </Stage>
        </div>
      </div>
    </div>
  );
}
              
