"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
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
} from "lucide-react";

import {
  Stage,
  Layer,
  Rect,
  Text,
  Line,
  Transformer,
  Circle,
} from "react-konva";

type NodeType = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  color?: string;
};

type EdgeType = {
  id: string;
  points: number[];
};

type LineDraft = {
  points: number[];
};

export default function FactoryEditor() {
  const [nodes, setNodes] = useState<NodeType[]>([]);
  const [edges, setEdges] = useState<EdgeType[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [drawingLine, setDrawingLine] = useState<LineDraft | null>(null);
  const [drawingMode, setDrawingMode] = useState(false);
  const [scale, setScale] = useState(1);
  const [stageSize, setStageSize] = useState({
    width: 1200,
    height: 800,
  });

  const stageRef = useRef<Konva.Stage | null>(null);
  const transformerRef = useRef<Konva.Transformer | null>(null);
  const shapeRefs = useRef<Record<string, Konva.Rect | null>>({});

  useEffect(() => {
    const updateSize = () => {
      setStageSize({
        width: window.innerWidth - 220,
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

    if (selectedId && shapeRefs.current[selectedId]) {
      transformer.nodes([shapeRefs.current[selectedId]!]);
      transformer.getLayer()?.batchDraw();
    } else {
      transformer.nodes([]);
      transformer.getLayer()?.batchDraw();
    }
  }, [selectedId, nodes]);

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedId) ?? null,
    [nodes, selectedId]
  );

  const addNode = () => {
    const newNode: NodeType = {
      id: uuidv4(),
      x: Math.random() * 400 + 100,
      y: Math.random() * 400 + 100,
      width: 140,
      height: 70,
      label: `Cluster ${nodes.length + 1}`,
      color: "#0891b2",
    };

    setNodes((prev) => [...prev, newNode]);
    setSelectedId(newNode.id);
  };

  const deleteSelectedNode = () => {
    if (!selectedId) return;
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

  const clearCanvas = () => {
    if (window.confirm("Clear all elements? This cannot be undone.")) {
      setNodes([]);
      setEdges([]);
      setSelectedId(null);
    }
  };

  const downloadJSON = () => {
    const data = { nodes, edges };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `factory-schema-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
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

  const handleTransformEnd = (
    id: string,
    target: Konva.Rect
  ) => {
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

  const handleStageMouseDown = (
    e: Konva.KonvaEventObject<MouseEvent>
  ) => {
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

  const handleStageMouseMove = (
    e: Konva.KonvaEventObject<MouseEvent>
  ) => {
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

    setEdges((prev) => [
      ...prev,
      {
        id: uuidv4(),
        points: drawingLine.points,
      },
    ]);

    setDrawingLine(null);
  };

  return (
    <div className="flex h-screen bg-gray-900">
      {/* Sidebar */}
      <div className="w-64 border-r border-gray-700 bg-gray-800 p-6 overflow-y-auto">
        <h1 className="mb-6 text-2xl font-bold text-white">Factory Editor</h1>

        {/* Main Controls */}
        <div className="space-y-3 mb-6">
          <button
            onClick={addNode}
            className="flex w-full items-center gap-2 rounded-lg bg-cyan-600 px-4 py-3 text-white font-medium hover:bg-cyan-700 transition"
          >
            <Plus size={18} /> Add Block
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
        </div>

        {/* Edit Label Section */}
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

        {/* Export & Utils */}
        <div className="space-y-2">
          <button
            onClick={downloadJSON}
            className="flex w-full items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition"
          >
            <Download size={16} /> Download JSON
          </button>
          <button
            onClick={clearCanvas}
            className="flex w-full items-center gap-2 rounded-lg bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-500 transition"
          >
            <RotateCcw size={16} /> Clear All
          </button>
        </div>

        <p className="mt-6 text-xs text-gray-500">
          <strong>Tip:</strong> Enable Drawing Mode and click + drag on empty canvas to draw lines. Click blocks to drag them.
        </p>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden bg-gray-900">
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
            {/* Grid Background */}
            {Array.from({ length: 50 }).map((_, i) =>
              Array.from({ length: 50 }).map((_, j) => (
                <Circle
                  key={`grid-${i}-${j}`}
                  x={i * 40}
                  y={j * 40}
                  radius={1}
                  fill="#4b5563"
                  listening={false}
                />
              ))
            )}

            {/* Lines/Edges */}
            {edges.map((edge) => (
              <React.Fragment key={edge.id}>
                <Line
                  points={edge.points}
                  stroke="#10b981"
                  strokeWidth={2.5}
                  hitStrokeWidth={10}
                  onClick={() => deleteEdge(edge.id)}
                  onTap={() => deleteEdge(edge.id)}
                  opacity={0.8}
                />
              </React.Fragment>
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

            {/* Nodes/Blocks */}
            {nodes.map((node) => (
              <React.Fragment key={node.id}>
                <Rect
                  ref={(el) => {
                    shapeRefs.current[node.id] = el;
                  }}
                  id={node.id}
                  x={node.x}
                  y={node.y}
                  width={node.width}
                  height={node.height}
                  fill={node.color || "#0891b2"}
                  stroke={selectedId === node.id ? "#fbbf24" : "transparent"}
                  strokeWidth={selectedId === node.id ? 3 : 0}
                  cornerRadius={10}
                  draggable
                  shadowBlur={selectedId === node.id ? 15 : 0}
                  shadowColor="rgba(59, 130, 246, 0.5)"
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
                    handleTransformEnd(node.id, e.target as Konva.Rect)
                  }
                />

                <Text
                  x={node.x}
                  y={node.y + node.height / 2 - 12}
                  width={node.width}
                  align="center"
                  text={node.label}
                  fill="white"
                  fontSize={13}
                  fontWeight="bold"
                  listening={false}
                  wrap="word"
                />
              </React.Fragment>
            ))}

            {/* Transformer */}
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
