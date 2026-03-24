"use client";

/**
 * GeoEventForceGraph — 2D force-directed graph showing relationships
 * between geopolitical events (same location, actor, time).
 *
 * Uses a simple spring physics simulation rendered to SVG.
 * Nodes colored by truth layer, sized by goldstein magnitude.
 *
 * S-Agent Phase 2 — Agentic Cognitive UI
 */

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { buildGeoEventGraph, graphStats } from "@/lib/geo-event-graph";
import { gdeltToBucket, acledToBucket } from "@/models/GeoEventBucket";
import type { GeoEventBucket } from "@/models/GeoEventBucket";
import type { GDELTEvent, ConflictEvent } from "@/types";
import type { GraphNode, GraphLink } from "@/lib/geo-event-graph";

// ── Colors ──────────────────────────────────────────────────────────────────

const TRUTH_COLORS: Record<string, string> = {
  OBSERVED: "#2D6A4F",
  COMPUTED: "#1B4965",
  ESTIMATED: "#E76F51",
  MARKET_REFERENCE: "#6C567B",
};

const RELATION_COLORS: Record<string, string> = {
  SAME_LOCATION: "#264653",
  SAME_ACTOR: "#E76F51",
  TEMPORAL_SEQUENCE: "#9CA3AF",
  CO_OCCURRING: "#457B9D",
};

// ── Simple force simulation ─────────────────────────────────────────────────

interface SimNode extends GraphNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

function initSimulation(nodes: GraphNode[], width: number, height: number): SimNode[] {
  return nodes.map((n, i) => ({
    ...n,
    x: width / 2 + (Math.cos(i * 2.39) * width * 0.3),
    y: height / 2 + (Math.sin(i * 2.39) * height * 0.3),
    vx: 0,
    vy: 0,
  }));
}

function stepSimulation(
  simNodes: SimNode[],
  links: GraphLink[],
  width: number,
  height: number,
): SimNode[] {
  const nodeMap = new Map(simNodes.map((n) => [n.id, n]));
  const damping = 0.85;
  const repulsion = 800;
  const springLength = 80;
  const springK = 0.02;
  const centerPull = 0.005;

  // Repulsion between all nodes
  for (let i = 0; i < simNodes.length; i++) {
    for (let j = i + 1; j < simNodes.length; j++) {
      const a = simNodes[i];
      const b = simNodes[j];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const force = repulsion / (dist * dist);
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      a.vx -= fx;
      a.vy -= fy;
      b.vx += fx;
      b.vy += fy;
    }
  }

  // Spring attraction along links
  for (const link of links) {
    const a = nodeMap.get(link.source);
    const b = nodeMap.get(link.target);
    if (!a || !b) continue;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const displacement = dist - springLength;
    const force = springK * displacement * link.weight;
    const fx = (dx / dist) * force;
    const fy = (dy / dist) * force;
    a.vx += fx;
    a.vy += fy;
    b.vx -= fx;
    b.vy -= fy;
  }

  // Center pull
  for (const node of simNodes) {
    node.vx += (width / 2 - node.x) * centerPull;
    node.vy += (height / 2 - node.y) * centerPull;
  }

  // Apply velocities with damping and bounds
  for (const node of simNodes) {
    node.vx *= damping;
    node.vy *= damping;
    node.x += node.vx;
    node.y += node.vy;
    node.x = Math.max(20, Math.min(width - 20, node.x));
    node.y = Math.max(20, Math.min(height - 20, node.y));
  }

  return [...simNodes];
}

// ── Component ───────────────────────────────────────────────────────────────

interface GeoEventForceGraphProps {
  gdeltEvents: GDELTEvent[];
  conflicts: ConflictEvent[];
  onNodeSelect?: (bucket: GeoEventBucket) => void;
  maxNodes?: number;
  className?: string;
}

export default function GeoEventForceGraph({
  gdeltEvents,
  conflicts,
  onNodeSelect,
  maxNodes = 60,
  className,
}: GeoEventForceGraphProps) {
  const WIDTH = 600;
  const HEIGHT = 400;
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const simNodesRef = useRef<SimNode[]>([]);
  const [renderTick, setRenderTick] = useState(0);
  const animRef = useRef<number>(0);
  const tickRef = useRef(0);

  // Build graph from events
  const { graph, bucketMap } = useMemo(() => {
    const buckets: GeoEventBucket[] = [
      ...gdeltEvents.map(gdeltToBucket),
      ...conflicts.map(acledToBucket),
    ];
    const g = buildGeoEventGraph(buckets, maxNodes);
    const bMap = new Map(buckets.map((b) => [b.id, b]));
    return { graph: g, bucketMap: bMap };
  }, [gdeltEvents, conflicts, maxNodes]);

  const stats = useMemo(() => graphStats(graph), [graph]);

  // Initialize simulation when graph changes
  useEffect(() => {
    simNodesRef.current = initSimulation(graph.nodes, WIDTH, HEIGHT);
    tickRef.current = 0;
  }, [graph.nodes]);

  // Animation loop (100 ticks then stop)
  useEffect(() => {
    const MAX_TICKS = 100;

    function tick() {
      if (tickRef.current >= MAX_TICKS) return;
      simNodesRef.current = stepSimulation(simNodesRef.current, graph.links, WIDTH, HEIGHT);
      tickRef.current++;
      setRenderTick(tickRef.current);
      animRef.current = requestAnimationFrame(tick);
    }

    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [graph]);

  const handleNodeClick = useCallback((nodeId: string) => {
    setSelectedNode(nodeId);
    const bucket = bucketMap.get(nodeId);
    if (bucket) onNodeSelect?.(bucket);
  }, [bucketMap, onNodeSelect]);

  const simNodes = simNodesRef.current;
  const nodeMap = new Map(simNodes.map((n) => [n.id, n]));

  return (
    <div className={`flex flex-col bg-[#1A1A2E] rounded-lg overflow-hidden ${className || ""}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#16213E] border-b border-[#264653]/30">
        <h3 className="text-sm font-semibold text-[#E8E8E8]">
          Event Relationship Graph
          <span className="ml-2 text-xs text-[#9CA3AF]">
            {stats.nodeCount} nodes, {stats.linkCount} links
          </span>
        </h3>
        <div className="flex gap-3 text-[10px] text-[#9CA3AF]">
          {Object.entries(stats.relationCounts).map(([rel, count]) => (
            <span key={rel} className="flex items-center gap-1">
              <span className="w-3 h-0.5 inline-block" style={{ backgroundColor: RELATION_COLORS[rel] || "#666" }} />
              {rel.replace(/_/g, " ").toLowerCase()} ({count})
            </span>
          ))}
        </div>
      </div>

      {/* SVG Graph */}
      <svg
        width="100%"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="bg-[#0a0a12]"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Links */}
        {graph.links.map((link, i) => {
          const source = nodeMap.get(link.source);
          const target = nodeMap.get(link.target);
          if (!source || !target) return null;
          const isHighlighted = hoveredNode === link.source || hoveredNode === link.target;
          return (
            <line
              key={`link-${i}`}
              x1={source.x}
              y1={source.y}
              x2={target.x}
              y2={target.y}
              stroke={RELATION_COLORS[link.relation] || "#333"}
              strokeWidth={isHighlighted ? 1.5 : 0.5}
              strokeOpacity={isHighlighted ? 0.8 : 0.2}
            />
          );
        })}

        {/* Nodes */}
        {simNodes.map((node) => {
          const radius = 3 + Math.abs(node.goldstein) * 0.5;
          const color = TRUTH_COLORS[node.truthLayer] || "#9CA3AF";
          const opacity = 0.4 + node.confidence * 0.6;
          const isHovered = hoveredNode === node.id;
          const isSelected = selectedNode === node.id;
          const isCritical = node.severity === "critical";

          return (
            <g key={node.id}>
              {/* Glow for critical */}
              {isCritical && (
                <circle cx={node.x} cy={node.y} r={radius + 4} fill="#E63946" opacity={0.2} />
              )}
              {/* Selection ring */}
              {isSelected && (
                <circle cx={node.x} cy={node.y} r={radius + 3} fill="none" stroke="#fff" strokeWidth={1} opacity={0.6} />
              )}
              {/* Node circle */}
              <circle
                cx={node.x}
                cy={node.y}
                r={isHovered ? radius + 2 : radius}
                fill={color}
                opacity={opacity}
                stroke={isHovered ? "#fff" : "none"}
                strokeWidth={1}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                onClick={() => handleNodeClick(node.id)}
              />
              {/* Label for hovered/selected */}
              {(isHovered || isSelected) && (
                <text
                  x={node.x}
                  y={node.y - radius - 4}
                  textAnchor="middle"
                  fill="#E8E8E8"
                  fontSize={9}
                  fontFamily="monospace"
                >
                  {node.label.substring(0, 30)}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Stats bar */}
      <div className="flex items-center gap-4 px-4 py-1.5 bg-[#16213E] border-t border-[#264653]/30 text-[10px] text-[#9CA3AF]">
        <span>{stats.countries} countries</span>
        <span>Avg Goldstein: {stats.avgGoldstein}</span>
        {selectedNode && (
          <span className="ml-auto text-[#E8E8E8]">
            Selected: {nodeMap.get(selectedNode)?.label?.substring(0, 40)}
          </span>
        )}
      </div>
    </div>
  );
}
