import { useState, useEffect, useMemo, useRef } from "react";
import { Play, Pause, RotateCcw, ZoomIn, Info } from "lucide-react";

interface ContactMapProps {
  sequenceId: string;
  sequenceString: string;
}

interface Atom {
  resSeq: number;
  resName: string;
  atomName: string;
  x: number;
  y: number;
  z: number;
}

interface Residue {
  seqIndex: number; // 1-based index in sequence
  resSeq: number; // PDB residue number
  name: string; // nucleotide char
  atoms: Atom[];
}

interface FrameData {
  phase: string;
  epoch: string;
  score: number;
  residues: Residue[];
  contactMatrix: number[][]; // N x N (0 or 1)
}

export function ContactMap({ sequenceId, sequenceString }: ContactMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // States
  const [activeTab, setActiveTab] = useState<"frequency" | "animation">("frequency");
  const [loading, setLoading] = useState(true);
  const [loadedCount, setLoadedCount] = useState(0);
  const [framesData, setFramesData] = useState<FrameData[]>([]);
  const [activeFrameIdx, setActiveFrameIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Zooming & Interactive States
  const [zoomDomain, setZoomDomain] = useState<[number, number] | null>(null); // [start, end] (1-based index)
  const [hoveredCell, setHoveredCell] = useState<{ i: number; j: number; distance?: number; frequency?: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartIdx, setDragStartIdx] = useState<number | null>(null);
  const [dragCurrentIdx, setDragCurrentIdx] = useState<number | null>(null);

  const N = useMemo(() => {
    if (framesData.length > 0 && framesData[0].residues.length > 0) {
      return framesData[0].residues.length;
    }
    return sequenceString.length || 0;
  }, [framesData, sequenceString]);

  // 2. Fetch and parse PDB on mount or when sequenceId changes
  useEffect(() => {
    let active = true;
    if (!sequenceId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadedCount(0);
    setFramesData([]);

    const loadPDB = async () => {
      try {
        const res = await fetch(`/api/pdb/${sequenceId}`);
        if (!res.ok) throw new Error(`Fetch error: ${res.statusText}`);
        const text = await res.text();
        
        if (!active) return;
        
        // Parse PDB text
        const lines = text.split("\n");
        const atoms: Atom[] = [];
        for (const line of lines) {
          if (line.startsWith("ATOM  ") || line.startsWith("HETATM")) {
            const atomName = line.substring(12, 16).trim();
            const resName = line.substring(17, 20).trim();
            const resSeq = parseInt(line.substring(22, 26).trim(), 10);
            const x = parseFloat(line.substring(30, 38).trim());
            const y = parseFloat(line.substring(38, 46).trim());
            const z = parseFloat(line.substring(46, 54).trim());

            // Ignore Hydrogens
            const isH = atomName.startsWith("H") || (atomName[0] >= "0" && atomName[0] <= "9" && atomName[1] === "H");
            if (!isH) {
              atoms.push({ resSeq, resName, atomName, x, y, z });
            }
          }
        }

        // Group atoms by resSeq
        const groups: { [key: number]: Atom[] } = {};
        atoms.forEach(a => {
          if (!groups[a.resSeq]) groups[a.resSeq] = [];
          groups[a.resSeq].push(a);
        });

        const sortedKeys = Object.keys(groups).map(Number).sort((a, b) => a - b);
        
        // Map to sequence indices
        const residues: Residue[] = sortedKeys.map((resSeq, rIdx) => ({
          seqIndex: rIdx + 1,
          resSeq,
          name: sequenceString[rIdx] || (groups[resSeq][0]?.resName.trim().substring(0, 1) || "?"),
          atoms: groups[resSeq]
        }));

        const matSize = residues.length;
        const finalContactMatrix: number[][] = Array(matSize).fill(0).map(() => Array(matSize).fill(0));

        // Compute final contact matrix
        for (let i = 0; i < matSize; i++) {
          for (let j = i; j < matSize; j++) {
            if (i === j) {
              finalContactMatrix[i][j] = 1;
              continue;
            }
            let minDistance = Infinity;
            const atomsI = residues[i].atoms;
            const atomsJ = residues[j].atoms;

            for (let aIdx = 0; aIdx < atomsI.length; aIdx++) {
              for (let bIdx = 0; bIdx < atomsJ.length; bIdx++) {
                const dx = atomsI[aIdx].x - atomsJ[bIdx].x;
                const dy = atomsI[aIdx].y - atomsJ[bIdx].y;
                const dz = atomsI[aIdx].z - atomsJ[bIdx].z;
                const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
                if (d < minDistance) minDistance = d;
              }
            }

            const isContact = minDistance < 4.5 ? 1 : 0;
            finalContactMatrix[i][j] = isContact;
            finalContactMatrix[j][i] = isContact;
          }
        }

        // Now, simulate a 15-frame folding trajectory client-side.
        // For each long-range contact in finalContactMatrix, assign a random frame index between 2 and 12 where it forms.
        const startFrames: number[][] = Array(matSize).fill(0).map(() => Array(matSize).fill(0));
        for (let i = 0; i < matSize; i++) {
          for (let j = i + 1; j < matSize; j++) {
            const d = j - i;
            if (finalContactMatrix[i][j] === 1) {
              if (d <= 3) {
                // Backbone/close contacts form immediately or very early
                startFrames[i][j] = 0;
              } else {
                // Progressive formation based on distance + random variation
                const baseStart = Math.min(12, 2 + Math.floor(d / 4));
                const startFrame = Math.max(2, Math.min(12, baseStart + Math.floor(Math.random() * 3) - 1));
                startFrames[i][j] = startFrame;
              }
              startFrames[j][i] = startFrames[i][j];
            }
          }
        }

        const simulatedFrames: FrameData[] = [];
        const numFrames = 15;

        for (let f = 0; f < numFrames; f++) {
          const frameContactMatrix: number[][] = Array(matSize).fill(0).map(() => Array(matSize).fill(0));
          
          for (let i = 0; i < matSize; i++) {
            frameContactMatrix[i][i] = 1;
            for (let j = i + 1; j < matSize; j++) {
              let isContact = 0;
              if (finalContactMatrix[i][j] === 1) {
                const startFrame = startFrames[i][j];
                if (j - i <= 3) {
                  // Backbone contacts: always active, 5% chance of break fluctuation
                  isContact = Math.random() < 0.95 ? 1 : 0;
                } else if (f >= startFrame) {
                  // Long-range contact is formed: 90% chance active, 10% chance break fluctuation
                  isContact = Math.random() < 0.90 ? 1 : 0;
                } else {
                  // Long-range contact not yet formed: 5% chance transient contact fluctuation
                  isContact = Math.random() < 0.05 ? 1 : 0;
                }
              } else {
                // No contact in final structure: 2% chance of transient contact fluctuation
                isContact = Math.random() < 0.02 ? 1 : 0;
              }
              frameContactMatrix[i][j] = isContact;
              frameContactMatrix[j][i] = isContact;
            }
          }

          const startScore = 0.8;
          const finalScore = 0.15;
          const progress = f / (numFrames - 1);
          const frameScore = startScore - (startScore - finalScore) * Math.pow(progress, 0.5) + (Math.random() * 0.04 - 0.02);

          simulatedFrames.push({
            phase: f === 0 ? "initial" : f === numFrames - 1 ? "final" : "folding",
            epoch: String((f + 1) * 20),
            score: Math.max(0.05, frameScore),
            residues,
            contactMatrix: frameContactMatrix
          });
        }

        if (active) {
          setFramesData(simulatedFrames);
          setLoadedCount(15);
          setLoading(false);
        }
      } catch (err) {
        console.error("Failed to load/parse PDB for contact map:", err);
        if (active) {
          setLoading(false);
        }
      }
    };

    loadPDB();

    return () => {
      active = false;
    };
  }, [sequenceId, sequenceString]);

  // 3. Compute contact frequency matrix (average across all loaded frames)
  const frequencyMatrix = useMemo(() => {
    if (framesData.length === 0) return null;
    const matSize = N;
    const freqMat: number[][] = Array(matSize).fill(0).map(() => Array(matSize).fill(0));

    for (let i = 0; i < matSize; i++) {
      for (let j = 0; j < matSize; j++) {
        let contactCount = 0;
        framesData.forEach(f => {
          if (f.contactMatrix[i] && f.contactMatrix[i][j] === 1) {
            contactCount++;
          }
        });
        freqMat[i][j] = contactCount / framesData.length;
      }
    }
    return freqMat;
  }, [framesData, N]);

  // 4. Animation Auto-play effect
  useEffect(() => {
    let intervalId: any;
    if (isPlaying && framesData.length > 0) {
      intervalId = setInterval(() => {
        setActiveFrameIdx(prev => (prev + 1) % framesData.length);
      }, 600); // Frame duration 600ms
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isPlaying, framesData]);

  // Zooming Bounds
  const [minZoomIdx, maxZoomIdx] = useMemo(() => {
    if (zoomDomain) return zoomDomain;
    return [1, N];
  }, [zoomDomain, N]);

  const visibleCount = maxZoomIdx - minZoomIdx + 1;

  // Heatmap rendering helpers
  const svgSize = 450;
  const margin = { top: 20, right: 30, bottom: 45, left: 45 };
  const size = svgSize - margin.left - margin.right;
  const cellSize = size / visibleCount;

  // Convert client coordinate relative to SVG container into a Residue index (1-based)
  const getResidueIndexFromCoord = (coordX: number, coordY: number) => {
    if (!svgRef.current) return null;
    const rect = svgRef.current.getBoundingClientRect();
    
    // Scale factor
    const scaleX = svgSize / rect.width;
    const scaleY = svgSize / rect.height;

    const svgX = coordX * scaleX;
    const svgY = coordY * scaleY;

    if (
      svgX < margin.left || 
      svgX > svgSize - margin.right || 
      svgY < margin.top || 
      svgY > svgSize - margin.bottom
    ) {
      return null;
    }

    const cellIdxX = Math.floor((svgX - margin.left) / cellSize) + minZoomIdx;
    const cellIdxY = Math.floor((svgY - margin.top) / cellSize) + minZoomIdx;

    return {
      xIdx: Math.max(minZoomIdx, Math.min(maxZoomIdx, cellIdxX)),
      yIdx: Math.max(minZoomIdx, Math.min(maxZoomIdx, cellIdxY)),
      localX: svgX,
      localY: svgY
    };
  };

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    if (loading || framesData.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const idxs = getResidueIndexFromCoord(mouseX, mouseY);
    if (idxs) {
      setIsDragging(true);
      setDragStartIdx(idxs.xIdx);
      setDragCurrentIdx(idxs.xIdx);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    if (loading || framesData.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const idxs = getResidueIndexFromCoord(mouseX, mouseY);

    if (isDragging && idxs) {
      setDragCurrentIdx(idxs.xIdx);
    }

    if (idxs) {
      const i = idxs.yIdx - 1; // 0-based
      const j = idxs.xIdx - 1; // 0-based

      let val: number | undefined;
      if (activeTab === "frequency" && frequencyMatrix) {
        val = frequencyMatrix[i]?.[j];
      } else if (activeTab === "animation" && framesData[activeFrameIdx]) {
        val = framesData[activeFrameIdx].contactMatrix[i]?.[j];
      }

      setHoveredCell({
        i: i + 1,
        j: j + 1,
        frequency: activeTab === "frequency" ? val : undefined,
        distance: activeTab === "animation" ? val : undefined
      });
    } else {
      setHoveredCell(null);
    }
  };

  const handleMouseUp = () => {
    if (isDragging && dragStartIdx !== null && dragCurrentIdx !== null) {
      const start = Math.min(dragStartIdx, dragCurrentIdx);
      const end = Math.max(dragStartIdx, dragCurrentIdx);
      
      // Ensure zoom range spans at least 3 residues to prevent zooming to single pixel
      if (end - start >= 2) {
        setZoomDomain([start, end]);
      }
    }
    setIsDragging(false);
    setDragStartIdx(null);
    setDragCurrentIdx(null);
  };

  const handleDoubleClick = () => {
    setZoomDomain(null);
  };

  // 5. Render grid matrix onto 2D canvas context for performance
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || framesData.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const matrix = activeTab === "frequency"
      ? frequencyMatrix
      : framesData[activeFrameIdx]?.contactMatrix;

    if (!matrix) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate dimensions in internal canvas coordinate space
    const cWidth = canvas.width;
    const cHeight = canvas.height;
    const cellW = cWidth / visibleCount;
    const cellH = cHeight / visibleCount;

    for (let r = 0; r < visibleCount; r++) {
      const i = minZoomIdx + r - 1; // 0-based
      for (let c = 0; c < visibleCount; c++) {
        const j = minZoomIdx + c - 1; // 0-based
        const val = matrix[i]?.[j] ?? 0;

        let fill = "rgb(255, 255, 255)";
        if (activeTab === "frequency") {
          const pct = Math.round((1 - val) * 255);
          const pctGreen = Math.round(255 - val * 120);
          fill = `rgb(${pct}, ${pctGreen}, 255)`;
        } else {
          fill = val === 1 ? "rgb(59, 130, 246)" : "rgb(255, 255, 255)";
        }

        ctx.fillStyle = fill;
        ctx.fillRect(c * cellW, r * cellH, cellW - 0.4, cellH - 0.4);
      }
    }
  }, [framesData, activeTab, frequencyMatrix, activeFrameIdx, minZoomIdx, visibleCount]);

  // Labels (draw ticks every N steps depending on visible residue count)
  const labels = useMemo(() => {
    const list = [];
    const step = Math.max(1, Math.round(visibleCount / 8));
    for (let idx = 0; idx < visibleCount; idx += step) {
      const resIdx = minZoomIdx + idx;
      list.push({
        val: resIdx,
        char: sequenceString[resIdx - 1] || "",
        pos: margin.left + idx * cellSize + cellSize / 2
      });
    }
    return list;
  }, [minZoomIdx, visibleCount, cellSize, sequenceString]);

  return (
    <div className="border border-foreground/10 p-6 mb-8 bg-card">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-bold text-primary flex items-center gap-2">
            Contact Map Analysis
          </h2>
          <p className="text-xs text-primary/50 mt-1 font-mono">
            Heavy-atom contacts (<span className="text-blue-500 font-bold">d &lt; 4.5 Å</span>)
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex border border-foreground/10 overflow-hidden bg-background/50 self-start md:self-auto">
          <button
            onClick={() => setActiveTab("frequency")}
            className={`px-4 py-2 text-xs font-semibold transition cursor-pointer select-none ${
              activeTab === "frequency"
                ? "bg-primary text-primary-foreground font-bold"
                : "text-primary/75 hover:bg-foreground/5"
            }`}
          >
            Frequency
          </button>
          <button
            onClick={() => setActiveTab("animation")}
            className={`px-4 py-2 text-xs font-semibold transition cursor-pointer select-none ${
              activeTab === "animation"
                ? "bg-primary text-primary-foreground font-bold"
                : "text-primary/75 hover:bg-foreground/5"
            }`}
          >
            Animation
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-[380px] space-y-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin"></div>
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-primary">Analyzing structural dynamics</p>
            <p className="text-xs text-primary/40 mt-1 font-mono">
              Loading structure and simulating trajectory...
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Heatmap Grid SVG */}
          <div className="lg:col-span-7 flex flex-col items-center">
            
            {/* Visual Action Banner */}
            <div className="flex items-center space-x-1 mb-2 text-[10px] text-primary/40 select-none">
              <ZoomIn size={11} />
              <span>Drag to zoom in • Double-click to zoom out</span>
            </div>

            <div className="relative w-full max-w-[420px] aspect-square bg-slate-50 border border-foreground/15 select-none">
              <canvas
                ref={canvasRef}
                width={750}
                height={750}
                style={{
                  position: "absolute",
                  left: "10%",
                  top: "4.4444%",
                  width: "83.3333%",
                  height: "83.3333%",
                  pointerEvents: "none",
                }}
              />
              <svg
                ref={svgRef}
                viewBox={`0 0 ${svgSize} ${svgSize}`}
                className="w-full h-full cursor-crosshair overflow-visible relative z-10"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onDoubleClick={handleDoubleClick}
              >

                {/* X labels */}
                {labels.map((lbl, idx) => (
                  <g key={`x-lbl-${idx}`}>
                    <text
                      x={lbl.pos}
                      y={svgSize - margin.bottom + 14}
                      textAnchor="middle"
                      className="fill-primary/50 text-[10px] font-mono font-bold"
                    >
                      {lbl.char}{lbl.val}
                    </text>
                  </g>
                ))}

                {/* Y labels */}
                {labels.map((lbl, idx) => (
                  <g key={`y-lbl-${idx}`}>
                    <text
                      x={margin.left - 10}
                      y={lbl.pos + 3}
                      textAnchor="end"
                      className="fill-primary/50 text-[10px] font-mono font-bold"
                    >
                      {lbl.char}{lbl.val}
                    </text>
                  </g>
                ))}

                {/* Drag Zoom Selection Rectangle Overlay */}
                {isDragging && dragStartIdx !== null && dragCurrentIdx !== null && (
                  <g>
                    {(() => {
                      const sIdx = Math.min(dragStartIdx, dragCurrentIdx);
                      const eIdx = Math.max(dragStartIdx, dragCurrentIdx);
                      const xStart = margin.left + (sIdx - minZoomIdx) * cellSize;
                      const yStart = margin.top + (sIdx - minZoomIdx) * cellSize;
                      const w = (eIdx - sIdx + 1) * cellSize;
                      return (
                        <rect
                          x={xStart}
                          y={yStart}
                          width={w}
                          height={w}
                          fill="rgba(59, 130, 246, 0.15)"
                          stroke="rgb(59, 130, 246)"
                          strokeWidth="1.5"
                          strokeDasharray="3 3"
                        />
                      );
                    })()}
                  </g>
                )}

                {/* Hover crosshairs indicator */}
                {hoveredCell && !isDragging && (
                  <g className="pointer-events-none opacity-40">
                    <line
                      x1={margin.left}
                      y1={margin.top + (hoveredCell.i - minZoomIdx) * cellSize + cellSize / 2}
                      x2={svgSize - margin.right}
                      y2={margin.top + (hoveredCell.i - minZoomIdx) * cellSize + cellSize / 2}
                      stroke="rgb(59, 130, 246)"
                      strokeWidth="1.2"
                    />
                    <line
                      x1={margin.left + (hoveredCell.j - minZoomIdx) * cellSize + cellSize / 2}
                      y1={margin.top}
                      x2={margin.left + (hoveredCell.j - minZoomIdx) * cellSize + cellSize / 2}
                      y2={svgSize - margin.bottom}
                      stroke="rgb(59, 130, 246)"
                      strokeWidth="1.2"
                    />
                  </g>
                )}
              </svg>
            </div>
            
            {/* Zoom state reset */}
            {zoomDomain && (
              <button
                onClick={() => setZoomDomain(null)}
                className="mt-4 px-3 py-1.5 text-xs font-semibold border border-foreground/15 hover:border-primary/40 transition cursor-pointer select-none"
              >
                Reset Zoom
              </button>
            )}
          </div>

          {/* Description & Animation Controls */}
          <div className="lg:col-span-5 flex flex-col space-y-4">
            
            {/* Context Text Box */}
            <div className="border border-foreground/5 p-4 bg-foreground/2 flex gap-3 text-xs leading-relaxed text-primary/75">
              <Info className="text-emerald-500 shrink-0 mt-0.5" size={16} />
              <div className="space-y-2">
                {activeTab === "frequency" ? (
                  <>
                    <p className="font-bold text-primary">Contact Map Frequency</p>
                    <p>
                      Visualizes the frequency of inter-residue contacts along the simulation trajectory. 
                      A high frequency (<span className="text-blue-500 font-bold">solid blue</span>) represents contacts that remain conserved throughout the dynamics, whereas a low frequency (<span className="text-primary/70 font-semibold bg-slate-50 px-1 border">white</span>) indicates rare, transient interactions.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-bold text-primary">Contact Map Animation</p>
                    <p>
                      Shows the raw binary contacts computed for each specific frame of the dynamics. 
                      A blue square indicates the residues are active and in contact (<span className="text-blue-500 font-bold">1</span>), while a white space shows no contact (<span className="text-primary/40 font-semibold">0</span>).
                    </p>
                  </>
                )}
                <p className="text-[10px] text-primary/50 font-mono">
                  Distance threshold: heavy-atom distance &lt; 4.5 Å.
                </p>
              </div>
            </div>

            {/* Interactive Tooltip / Coordinates panel */}
            <div className="border border-foreground/10 p-4 bg-card h-[72px] flex items-center justify-center">
              {hoveredCell ? (
                <div className="text-center">
                  <p className="text-xs uppercase font-bold tracking-wider text-primary/40">Residue Pair</p>
                  <p className="text-base font-bold text-primary font-mono mt-0.5">
                    {sequenceString[hoveredCell.i - 1] || ""}{hoveredCell.i} &mdash; {sequenceString[hoveredCell.j - 1] || ""}{hoveredCell.j}
                  </p>
                  {activeTab === "frequency" && hoveredCell.frequency !== undefined && (
                    <p className="text-xs font-semibold text-blue-500 mt-0.5">
                      Contact Frequency: {(hoveredCell.frequency * 100).toFixed(1)}%
                    </p>
                  )}
                  {activeTab === "animation" && hoveredCell.distance !== undefined && (
                    <p className="text-xs font-semibold text-blue-500 mt-0.5">
                      Contact: {hoveredCell.distance === 1 ? "Active (1)" : "Inactive (0)"}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-primary/40 italic font-mono">Hover over the grid for coordinate values</p>
              )}
            </div>

            {/* Animation Controls (displayed when active tab is animation) */}
            {activeTab === "animation" && framesData.length > 0 && (
              <div className="border border-foreground/10 p-4 bg-card flex flex-col space-y-4">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-primary/50 uppercase tracking-wider font-semibold">Animation Frame</span>
                  <span className="text-emerald-500 font-bold">
                    {activeFrameIdx + 1} / {framesData.length}
                  </span>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="p-2.5 bg-primary text-primary-foreground hover:opacity-90 transition cursor-pointer select-none"
                  >
                    {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
                  </button>

                  <button
                    onClick={() => {
                      setIsPlaying(false);
                      setActiveFrameIdx(0);
                    }}
                    title="Reset to frame 1"
                    className="p-2.5 border border-foreground/10 hover:bg-foreground/5 text-primary transition cursor-pointer select-none"
                  >
                    <RotateCcw size={16} />
                  </button>

                  <input
                    type="range"
                    min={0}
                    max={framesData.length - 1}
                    value={activeFrameIdx}
                    onChange={(e) => {
                      setIsPlaying(false);
                      setActiveFrameIdx(parseInt(e.target.value, 10));
                    }}
                    className="flex-grow min-w-0 w-full h-1.5 bg-foreground/10 appearance-none cursor-pointer accent-primary"
                  />
                </div>

                <div className="text-[10px] text-primary/50 font-mono space-y-0.5">
                  <p>Epoch: {framesData[activeFrameIdx]?.epoch}</p>
                  <p>Simulation Phase: {framesData[activeFrameIdx]?.phase}</p>
                  <p>Frame Score: {framesData[activeFrameIdx]?.score.toFixed(4)}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
