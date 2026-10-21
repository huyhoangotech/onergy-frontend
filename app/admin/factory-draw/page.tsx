"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import type Konva from "konva";

import {
  Plus,
  Trash2,
  Edit,
  Download,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Save,
  Upload,
  ArrowLeft,
  Loader,
  AlertCircle,
  Image as ImageIcon,
  Building2,
  Network,
  Undo2,
} from "lucide-react";
import {
  Stage,
  Layer,
  Rect,
  Text,
  Line,
  Transformer,
  Circle,
  Image,
} from "react-konva";
import { api } from "@/lib/api";

// Set up PDF worker

type NodeType = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  color?: string;
  nodeType?: "station" | "cluster" | "custom";
};

type EdgeType = {
  id: string;
  points: number[];
};

type TreeNode = {
  id: string;
  name: string;
  type: "site" | "station" | "cluster";
  children?: TreeNode[];
};

type Site = {
  site_id: string;
  name: string;
  address?: string;
};

type DrawingData = {
  nodes: NodeType[];
  edges: EdgeType[];
  backgroundUrl?: string;
};

type HistoryState = {
  nodes: NodeType[];
  edges: EdgeType[];
};



function FactoryDrawingEditor() {
  // State: Navigation & Loading
  const [currentStep, setCurrentStep] = useState<"select-site" | "editor">(
    "select-site"
  );
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // State: Tree Data
  const [tree, setTree] = useState<TreeNode[]>([]);

  // State: Canvas
  const [nodes, setNodes] = useState<NodeType[]>([]);
  const [edges, setEdges] = useState<EdgeType[]>([]);
  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null);
  const [backgroundImage, setBackgroundImage] = useState<HTMLImageElement | null>(
    null
  );
  const [backgroundFile, setBackgroundFile] =
  useState<File | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [drawingLine, setDrawingLine] = useState<{ points: number[] } | null>(
    null
  );
  const [drawingMode, setDrawingMode] = useState(false);
  const [scale, setScale] = useState(1);
  const [stageSize, setStageSize] = useState({
    width: 1200,
    height: 800,
  });
const [bgNode, setBgNode] = useState<{
  x: number;
  y: number;
  width: number;
  height: number;
} | null>(null);

  // State: History (Undo - max 3 steps)
  const [history, setHistory] = useState<HistoryState[]>([]);
  const MAX_HISTORY = 3;

const bgRef = useRef<Konva.Image | null>(null);
  // Refs
  const stageRef = useRef<Konva.Stage | null>(null);
  const transformerRef = useRef<Konva.Transformer | null>(null);
const shapeRefs = useRef<Record<string, Konva.Node | null>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const backgroundFileRef = useRef<HTMLInputElement>(null);

  // Background size controls
  const [bgWidth, setBgWidth] = useState(800);
  const [bgHeight, setBgHeight] = useState(600);

  // Save current state to history before making changes
  const saveToHistory = () => {
    setHistory((prev) => {
      const newHistory = [{ nodes: [...nodes], edges: [...edges] }, ...prev];
      // Keep only last 3 states to save RAM
      return newHistory.slice(0, MAX_HISTORY);
    });
  };

  // Undo last action
  const handleUndo = () => {
    if (history.length === 0) return;

    const previousState = history[0];
    setNodes(previousState.nodes);
    setEdges(previousState.edges);

    // Remove the undone state from history
    setHistory((prev) => prev.slice(1));
  };

  const canUndo = history.length > 0;

  // Load all sites
 const loadSites = async () => {
  setLoading(true);
  setError("");
  try {
    const { data } = await api.get("/api/admin/sites");

    console.log("Sites:", data);

    setSites(Array.isArray(data.data) ? data.data : []);
  } catch (err) {
    console.error("Load sites failed:", err);
    setError("Cannot load sites");
  } finally {
    setLoading(false);
  }
};
useEffect(() => {
    loadSites();
  }, []);

  // Load site tree
 const loadSiteTree = async (siteId: string) => {
  setLoading(true);
  setError("");

  try {
    const res = await api.get(`/api/admin/sites/${siteId}/tree`);

    console.log("TREE RESPONSE:", res);

    const items = res.data.data; // 🔥 đúng tầng

    if (!Array.isArray(items)) {
      console.error("Tree is not array:", items);
      setError("Invalid tree data");
      return;
    }

    const treeData = buildTree(items);
    setTree(treeData);
    setCurrentStep("editor");
  } catch (err) {
    console.error("Load tree failed:", err);
    setError("Cannot load site tree");
  } finally {
    setLoading(false);
  }
};
const renderTreeNode = (
  node: TreeNode,
  level = 0
): React.ReactNode => {
  return (
    <div key={node.id} className="space-y-2">
      <button
        onClick={() => addNodeFromTree(node)}
        className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-white transition
        ${
          node.type === "site"
            ? "bg-gray-700 hover:bg-gray-600"
            : node.type === "station"
            ? "bg-blue-700 hover:bg-blue-600"
            : "bg-indigo-700 hover:bg-indigo-600"
        }`}
        style={{
          marginLeft: `${level * 12}px`,
        }}
      >
        {node.type === "station" ? (
          <Building2 size={14} />
        ) : node.type === "cluster" ? (
          <Network size={14} />
        ) : (
          <Building2 size={14} />
        )}

        {node.name}
      </button>

      {node.children?.map((child) =>
        renderTreeNode(child, level + 1)
      )}
    </div>
  );
};
  // Build tree structure
 const buildTree = (items: any[]): TreeNode[] => {
  if (!Array.isArray(items)) return [];

  // 🔥 remove duplicated rows caused by devices
  const uniqueMap = new Map<string, any>();

  items.forEach((item) => {
    if (!uniqueMap.has(item.site_id)) {
      uniqueMap.set(item.site_id, item);
    }
  });

  const uniqueItems = Array.from(uniqueMap.values());

  // 🔥 create node map
  const nodeMap = new Map<string, TreeNode>();

  uniqueItems.forEach((item) => {
    nodeMap.set(item.site_id, {
      id: item.site_id,
      name: item.name,
      type: item.type,
      children: [],
    });
  });

  // 🔥 build hierarchy
  const roots: TreeNode[] = [];

  uniqueItems.forEach((item) => {
    const node = nodeMap.get(item.site_id);

    if (!node) return;

    if (!item.parent_id) {
      roots.push(node);
    } else {
      const parent = nodeMap.get(item.parent_id);

      if (parent) {
        parent.children?.push(node);
      }
    }
  });

  return roots;
};
  // Select site and load tree
  const handleSelectSite = async (site: Site) => {
  setSelectedSite(site);
  await loadSiteTree(site.site_id); // 🔥 FIX
};
  // Add node from tree
  const addNodeFromTree = (treeNode: TreeNode) => {
    const newNode: NodeType = {
      id: uuidv4(),
      x: Math.random() * 400 + 100,
      y: Math.random() * 400 + 100,
      width: 140,
      height: 70,
      label: treeNode.name,
      color: treeNode.type === "station" ? "#0891b2" : "#06b6d4",
      nodeType: treeNode.type as "station" | "cluster" | "custom",
    };
    setNodes((prev) => [...prev, newNode]);
    setSelectedId(newNode.id);
  };

  // Background upload
 const handleBackgroundUpload = async (
  e: React.ChangeEvent<HTMLInputElement>
) => {
  const file = e.target.files?.[0];

  if (!file) return;

  setBackgroundFile(file);

  const isPDF =
    file.type === "application/pdf" ||
    file.name.toLowerCase().endsWith(".pdf");

 if (isPDF) {
  try {
    const PDFJS = await import("pdfjs-dist");
    
    // Set up PDF worker từ public folder
    PDFJS.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

    const arrayBuffer = await file.arrayBuffer();

    const pdf = await PDFJS.getDocument({
      data: arrayBuffer,
    }).promise;

    const page = await pdf.getPage(1);

    const viewport = page.getViewport({ scale: 2 });

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

    const imgData = canvas.toDataURL("image/png");

    const img = new window.Image();

    img.onload = () => {
      console.log("PDF image loaded");

      setBackgroundImage(img);

      setBgNode({
        x: 50,
        y: 50,
        width: viewport.width,
        height: viewport.height,
      });
    };

    img.src = imgData;
  } catch (err) {
    console.error("PDF render failed:", err);
  }

  return;
}
};

  // Canvas functions
  const addNode = () => {
    saveToHistory();
    const newNode: NodeType = {
      id: uuidv4(),
      x: Math.random() * 400 + 100,
      y: Math.random() * 400 + 100,
      width: 140,
      height: 70,
      label: `Block ${nodes.length + 1}`,
      color: "#0891b2",
      nodeType: "custom",
    };
    setNodes((prev) => [...prev, newNode]);
    setSelectedId(newNode.id);
  };

  const deleteSelectedNode = () => {
    if (!selectedId) return;
    saveToHistory();
    setNodes((prev) => prev.filter((n) => n.id !== selectedId));
    setEdges((prev) =>
      prev.filter((e) => {
        const [x1, y1, x2, y2] = e.points;
        const node = nodes.find((n) => n.id === selectedId);
        if (!node) return true;
        return !((x1 === node.x || x2 === node.x) && (y1 === node.y || y2 === node.y));
      })
    );
    setSelectedId(null);
  };

  const deleteEdge = (edgeId: string) => {
    saveToHistory();
    setEdges((prev) => prev.filter((e) => e.id !== edgeId));
  };

  const startEditLabel = (label: string) => {
    setEditingLabel(selectedId);
    setEditingValue(label);
  };

  const saveEditLabel = () => {
    if (!editingLabel) return;
    setNodes((prev) =>
      prev.map((n) =>
        n.id === editingLabel ? { ...n, label: editingValue } : n
      )
    );
    setEditingLabel(null);
  };

  const handleSelect = (id: string) => {
    setSelectedId(id);
  };

  const handleDragMove = (id: string, e: Konva.KonvaEventObject<DragEvent>) => {
    const target = e.target;
    setNodes((prev) =>
      prev.map((node) =>
        node.id === id
          ? {
              ...node,
              x: target.x(),
              y: target.y(),
            }
          : node
      )
    );
  };

  const handleTransformEnd = (id: string, target: Konva.Rect) => {
    const scaleX = target.scaleX();
    const scaleY = target.scaleY();

    const newWidth = Math.max(50, target.width() * scaleX);
    const newHeight = Math.max(30, target.height() * scaleY);

    target.scaleX(1);
    target.scaleY(1);

    setNodes((prev) =>
      prev.map((node) =>
        node.id === id
          ? {
              ...node,
              x: target.x(),
              y: target.y(),
              width: newWidth,
              height: newHeight,
            }
          : node
      )
    );
  };

  const handleStageMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const clickedOnStage = e.target === e.target.getStage();

    if (!clickedOnStage) return;

    setSelectedId(null);
    setEditingLabel(null);

    if (!drawingMode) return;

    const pos = e.target.getStage()?.getPointerPosition();
    if (!pos) return;

    setDrawingLine({
      points: [pos.x / scale, pos.y / scale, pos.x / scale, pos.y / scale],
    });
  };

  const handleStageMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!drawingLine || !drawingMode) return;

    const point = e.target.getStage()?.getPointerPosition();
    if (!point) return;

    setDrawingLine((prev) => {
      if (!prev) return null;

      return {
        points: [
          prev.points[0],
          prev.points[1],
          point.x / scale,
          point.y / scale,
        ],
      };
    });
  };

  const handleStageMouseUp = () => {
    if (!drawingLine) return;

    saveToHistory();
    setEdges((prev) => [
      ...prev,
      {
        id: uuidv4(),
        points: drawingLine.points,
      },
    ]);

    setDrawingLine(null);
  };

  // Save drawing
 const saveDrawing = async () => {
  if (!selectedSite) return;

  setSaving(true);

  try {
    let uploadedBackgroundUrl: string | null = null;

    // upload background trước
    if (backgroundFile) {
      const formData = new FormData();

      formData.append("file", backgroundFile);

      const token = localStorage.getItem("adminToken");

      const uploadRes = await fetch(
        "http://localhost:5000/api/admin/drawings/upload-background",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const uploadResult = await uploadRes.json();

      uploadedBackgroundUrl = uploadResult.data.url;
    }

    const drawingData = {
      nodes,
      edges,
      backgroundUrl: uploadedBackgroundUrl,
    };

    await api.post("/api/admin/drawings", {
      site_id: selectedSite.site_id,
      name: `Drawing - ${new Date().toLocaleString()}`,
      background_url: uploadedBackgroundUrl,
      data: drawingData,
    });

    alert("Saved!");
  } catch (err) {
    console.error(err);
  } finally {
    setSaving(false);
  }
};

  // Initialize
  useEffect(() => {
    const updateSize = () => {
      setStageSize({
        width: window.innerWidth - 320,
        height: window.innerHeight,
      });
    };

    updateSize();
    window.addEventListener("resize", updateSize);

    return () => window.removeEventListener("resize", updateSize);
  }, []);

 useEffect(() => {
  const transformer = transformerRef.current;
  if (!transformer) return;

  if (selectedId === "background" && bgRef.current) {
    transformer.nodes([bgRef.current]);
  } else if (selectedId && shapeRefs.current[selectedId]) {
    transformer.nodes([shapeRefs.current[selectedId]!]);
  } else {
    transformer.nodes([]);
  }

  transformer.getLayer()?.batchDraw();
}, [selectedId, nodes, bgNode]);

  useEffect(() => {
    if (currentStep === "select-site") {
      loadSites();
    }
  }, []);

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedId) ?? null,
    [nodes, selectedId]
  );

  // Site Selection Screen
  if (currentStep === "select-site") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-8">
        <div className="mx-auto max-w-2xl">
          <h1 className="mb-2 text-4xl font-bold text-white">Factory Drawing</h1>
          <p className="mb-8 text-gray-400">
            Select a site to start creating floor plan diagrams
          </p>

          {error && (
            <div className="mb-6 rounded-lg bg-red-900 border border-red-700 p-4 flex gap-3">
              <AlertCircle className="text-red-400" size={20} />
              <p className="text-red-200">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="animate-spin text-cyan-400" size={32} />
            </div>
          ) : (
            <div className="grid gap-4">
              {sites.map((site) => (
                <button
                  key={site.site_id}
                  onClick={() => handleSelectSite(site)}
                  className="rounded-lg bg-gray-700 p-6 text-left transition hover:bg-gray-600 border border-gray-600 hover:border-cyan-500"
                >
                  <h3 className="text-xl font-semibold text-white">{site.name}</h3>
                  {site.address && (
                    <p className="mt-2 text-gray-400">{site.address}</p>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Editor Screen
  return (
    <div className="flex h-screen bg-gray-900">
      {/* Sidebar */}
      <div className="w-80 border-r border-gray-700 bg-gray-800 p-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Factory Editor</h1>
            <p className="text-sm text-gray-400 mt-1">{selectedSite?.name}</p>
          </div>
          <button
            onClick={() => setCurrentStep("select-site")}
            className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300"
            title="Back to site selection"
          >
            <ArrowLeft size={18} />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-900 border border-red-700 p-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {/* Background Upload */}
        <div className="mb-6 rounded-lg border border-gray-600 bg-gray-700 p-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Background Image/PDF
          </label>
        <input
          ref={backgroundFileRef}
          type="file"
          accept="image/*,.pdf,application/pdf"
          onChange={handleBackgroundUpload}
          className="hidden"
        />
          <button
            onClick={() => backgroundFileRef.current?.click()}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-600 px-4 py-2 text-sm text-gray-200 hover:bg-gray-500 transition"
          >
            <Upload size={16} /> Upload Background
          </button>
          {backgroundUrl && (
            <p className="mt-2 text-xs text-green-400">Background loaded</p>
          )}
        </div>

        {/* Add Block & Undo */}
        <div className="space-y-3 mb-6">
          <button
            onClick={addNode}
            className="flex w-full items-center gap-2 rounded-lg bg-cyan-600 px-4 py-3 text-white font-medium hover:bg-cyan-700 transition"
          >
            <Plus size={18} /> Add Custom Block
          </button>

          <button
            onClick={() => setDrawingMode(!drawingMode)}
            className={`flex w-full items-center gap-2 rounded-lg px-4 py-3 font-medium transition ${
              drawingMode
                ? "bg-amber-600 text-white hover:bg-amber-700"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            {drawingMode ? "✓ Drawing Mode" : "Draw Lines"}
          </button>

          <button
            onClick={handleUndo}
            disabled={!canUndo}
            className="flex w-full items-center gap-2 rounded-lg bg-purple-600 px-4 py-3 text-white font-medium hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            title={`Undo (${history.length}/3)`}
          >
            <Undo2 size={18} /> Undo ({history.length}/3)
          </button>
        </div>

        {/* Site Elements */}
     <div className="mb-6">
  <p className="text-sm font-semibold text-gray-300 mb-3">
    Site Elements
  </p>

  <div className="space-y-2">
    {tree.map((node) => renderTreeNode(node))}
  </div>
</div>

        {/* Edit Label */}
        {editingLabel && selectedNode && (
          <div className="mb-6 rounded-lg border border-cyan-600 bg-gray-700 p-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Edit Label
            </label>
            <input
              autoFocus
              type="text"
              value={editingValue}
              onChange={(e) => setEditingValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveEditLabel();
              }}
              className="w-full rounded px-2 py-2 text-sm bg-gray-600 text-white border border-gray-500 focus:border-cyan-500 focus:outline-none"
            />
            <div className="mt-2 flex gap-2">
              <button
                onClick={saveEditLabel}
                className="flex-1 rounded bg-cyan-600 px-2 py-1 text-xs font-medium text-white hover:bg-cyan-700"
              >
                Save
              </button>
              <button
                onClick={() => setEditingLabel(null)}
                className="flex-1 rounded bg-gray-600 px-2 py-1 text-xs font-medium text-white hover:bg-gray-500"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Selected Node Info */}
        {selectedNode && !editingLabel && (
          <div className="mb-6 rounded-lg border border-gray-600 bg-gray-700 p-4">
            <p className="text-sm font-semibold text-gray-300 mb-3">Selected</p>
            <div className="space-y-2 text-xs text-gray-400 mb-4">
              <p>
                <strong>Name:</strong> {selectedNode.label}
              </p>
              <p>
                <strong>X:</strong> {Math.round(selectedNode.x)}
              </p>
              <p>
                <strong>Y:</strong> {Math.round(selectedNode.y)}
              </p>
              <p>
                <strong>Width:</strong> {Math.round(selectedNode.width)}
              </p>
              <p>
                <strong>Height:</strong> {Math.round(selectedNode.height)}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => startEditLabel(selectedNode.label)}
                className="flex-1 flex items-center justify-center gap-1 rounded bg-blue-600 px-2 py-2 text-xs font-medium text-white hover:bg-blue-700"
              >
                <Edit size={14} /> Edit
              </button>
              <button
                onClick={deleteSelectedNode}
                className="flex-1 flex items-center justify-center gap-1 rounded bg-red-600 px-2 py-2 text-xs font-medium text-white hover:bg-red-700"
              >
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="mb-6 rounded-lg border border-gray-600 bg-gray-700 p-4">
          <p className="text-sm font-semibold text-gray-300 mb-2">Diagram Stats</p>
          <div className="space-y-1 text-xs text-gray-400">
            <p>Blocks: {nodes.length}</p>
            <p>Lines: {edges.length}</p>
          </div>
        </div>

        {/* Save Button */}
        {/* Background Size Controls */}
        <div className="border-t border-gray-700 pt-4">
          <p className="text-sm font-semibold text-gray-300 mb-3">Background Size</p>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Width: {bgWidth}px</label>
              <input
                type="range"
                min="200"
                max="2000"
                value={bgWidth}
                onChange={(e) => {
                  setBgWidth(parseInt(e.target.value));
                  if (bgNode) {
                    setBgNode({ ...bgNode, width: parseInt(e.target.value) });
                  }
                }}
                className="w-full"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Height: {bgHeight}px</label>
              <input
                type="range"
                min="200"
                max="2000"
                value={bgHeight}
                onChange={(e) => {
                  setBgHeight(parseInt(e.target.value));
                  if (bgNode) {
                    setBgNode({ ...bgNode, height: parseInt(e.target.value) });
                  }
                }}
                className="w-full"
              />
            </div>
          </div>
        </div>

        <button
          onClick={saveDrawing}
          disabled={saving}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-3 text-white font-medium hover:bg-green-700 transition disabled:opacity-50 mt-4"
        >
          {saving ? (
            <>
              <Loader size={16} className="animate-spin" /> Saving...
            </>
          ) : (
            <>
              <Save size={16} /> Save Drawing
            </>
          )}
        </button>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden bg-white">
        {/* Toolbar */}
        <div className="absolute top-4 right-4 z-10 flex gap-2 bg-gray-800 rounded-lg p-2 border border-gray-700">
          <button
            onClick={() => setScale(Math.min(scale + 0.2, 3))}
            className="p-2 rounded bg-gray-700 hover:bg-gray-600 text-white"
            title="Zoom In"
          >
            <ZoomIn size={18} />
          </button>
          <button
            onClick={() => setScale(Math.max(scale - 0.2, 0.5))}
            className="p-2 rounded bg-gray-700 hover:bg-gray-600 text-white"
            title="Zoom Out"
          >
            <ZoomOut size={18} />
          </button>
          <span className="px-3 py-2 text-sm text-gray-300 font-medium">
            {Math.round(scale * 100)}%
          </span>
        </div>

        <Stage
          width={stageSize.width}
          height={stageSize.height}
          ref={stageRef}
          onMouseDown={handleStageMouseDown}
          onMouseMove={handleStageMouseMove}
          onMouseUp={handleStageMouseUp}
          scaleX={scale}
          scaleY={scale}
        >
          <Layer>
            {/* Background Image */}
            {backgroundImage && bgNode && (
  <Image
    ref={bgRef}
    image={backgroundImage}
    x={bgNode.x}
    y={bgNode.y}
    width={bgNode.width}
    height={bgNode.height}
    draggable
    onClick={(e) => {
      e.cancelBubble = true;
      setSelectedId("background");
    }}
    onDragMove={(e) => {
      const node = e.target;
      setBgNode((prev) =>
        prev
          ? { ...prev, x: node.x(), y: node.y() }
          : prev
      );
    }}
    onTransformEnd={(e) => {
      const node = e.target as Konva.Image;

      const scaleX = node.scaleX();
      const scaleY = node.scaleY();

      const newWidth = Math.max(100, node.width() * scaleX);
      const newHeight = Math.max(100, node.height() * scaleY);

      node.scaleX(1);
      node.scaleY(1);

      setBgNode((prev) =>
        prev
          ? {
              ...prev,
              x: node.x(),
              y: node.y(),
              width: newWidth,
              height: newHeight,
            }
          : prev
      );
    }}
  />
)}

            {/* Grid Background */}
            {Array.from({ length: 50 }).map((_, i) =>
              Array.from({ length: 50 }).map((_, j) => (
                <Circle
                  key={`grid-${i}-${j}`}
                  x={i * 40}
                  y={j * 40}
                  radius={1}
                 fill="#e5e7eb" // xám rất nhạt
                  listening={false}
                />
              ))
            )}

            {/* Lines */}
            {edges.map((edge) => (
              <Line
                key={edge.id}
                points={edge.points}
                stroke="#10b981"
                strokeWidth={2.5}
                hitStrokeWidth={10}
                onClick={() => deleteEdge(edge.id)}
                onTap={() => deleteEdge(edge.id)}
                opacity={0.8}
              />
            ))}

            {/* Drawing Line Preview */}
            {drawingLine && (
              <Line
                points={drawingLine.points}
                stroke="#f59e0b"
                strokeWidth={2}
                dash={[8, 4]}
                opacity={0.7}
              />
            )}

            {/* Nodes - Text Only */}
            {nodes.map((node) => (
              <Text
                key={node.id}
                ref={(el) => {
                  shapeRefs.current[node.id] = el;
                }}
                id={node.id}
                x={node.x}
                y={node.y}
                text={node.label}
                fill={selectedId === node.id ? "#fbbf24" : "#0891b2"}
                fontSize={16}
                fontWeight="bold"
                draggable
                onClick={(e) => {
                  e.cancelBubble = true;
                  handleSelect(node.id);
                }}
                onTap={(e) => {
                  e.cancelBubble = true;
                  handleSelect(node.id);
                }}
                onDragMove={(e) => handleDragMove(node.id, e)}
                onTransformEnd={(e) =>
                  handleTransformEnd(node.id, e.target as any)
                }
              />
            ))}

            <Transformer
              ref={transformerRef}
              boundBoxFunc={(oldBox, newBox) => {
                if (newBox.width < 50 || newBox.height < 30) {
                  return oldBox;
                }
                return newBox;
              }}
              enabledAnchors={[
                "top-left",
                "top-right",
                "bottom-left",
                "bottom-right",
              ]}
            />
          </Layer>
        </Stage>
      </div>
    </div>
  );
}

export default FactoryDrawingEditor;
