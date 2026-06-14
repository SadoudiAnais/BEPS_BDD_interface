import { useMemo, useState } from "react";
import { LineChart, MarkElement } from "@mui/x-charts/LineChart";
import Slider from "@mui/material/Slider";

interface Interframe {
  epoch: number;
  score: number;
  phase: string;
}

interface TrajectoryPlotProps {
  interframes?: Interframe[];
  currentId?: string;
  variants?: any[];
}

// Helper to reliably extract MongoDB ObjectId string
const getObjectIdStr = (idObj: any): string => {
  if (typeof idObj === "string") return idObj;
  if (idObj && typeof idObj === "object" && idObj.$oid) return idObj.$oid;
  return String(idObj || "");
};

const CustomMark = (props: any) => {
  const { cx, cy, seriesId } = props;

  if (seriesId === "best-frame-series" && typeof cx === "number" && typeof cy === "number") {
    return (
      <g key="best-frame-mark">
        {/* Pinging background outline */}
        <circle
          cx={cx}
          cy={cy}
          r={7}
          fill="rgba(16, 185, 129, 0.25)"
          stroke="#10b981"
          strokeWidth={2}
          className="animate-ping"
          style={{ transformOrigin: `${cx}px ${cy}px` }}
        />
        {/* Solid center dot */}
        <circle
          cx={cx}
          cy={cy}
          r={4.5}
          fill="#10b981"
          stroke="#ffffff"
          strokeWidth={1.5}
        />
      </g>
    );
  }

  // Render default mark element for other series to keep hover states working
  return <MarkElement {...props} />;
};

export function TrajectoryPlot({ interframes, currentId, variants }: TrajectoryPlotProps) {
  // Group and select variants (one per bead_atom, preferring active/matching versions)
  const plottedVariants = useMemo(() => {
    const activeId = getObjectIdStr(currentId);

    if (variants && variants.length > 0) {
      // Find unique bead atoms
      const uniqueAtoms = Array.from(
        new Set(variants.map((v) => v.metrics?.bead_atom).filter(Boolean))
      );

      return uniqueAtoms.map((atom) => {
        const atomVariants = variants.filter((v) => v.metrics?.bead_atom === atom);
        const active = atomVariants.find((v) => getObjectIdStr(v._id) === activeId);
        if (active) return active;

        const current = variants.find((v) => getObjectIdStr(v._id) === activeId);
        const sameVersion = atomVariants.find((v) => v.vers === current?.vers);
        if (sameVersion) return sameVersion;

        return atomVariants[0];
      });
    } else {
      // Fallback: single series representing current sequence
      return [
        {
          _id: activeId || "active",
          metrics: { bead_atom: "Score" },
          interframes: interframes || [],
        },
      ];
    }
  }, [variants, currentId, interframes]);

  // Extract union of all epochs across all plotted variants (coercing strings safely)
  const allEpochs = useMemo(() => {
    const epochSet = new Set<number>();
    plottedVariants.forEach((v) => {
      const frames = v.interframes || [];
      frames.forEach((f: any) => {
        const ep = f.epoch !== null && f.epoch !== undefined ? Number(f.epoch) : NaN;
        if (!isNaN(ep) && typeof f.score === "number" && !isNaN(f.score)) {
          epochSet.add(ep);
        }
      });
    });
    return Array.from(epochSet).sort((a, b) => a - b);
  }, [plottedVariants]);

  // Global maximum epoch
  const maxEpoch = useMemo(() => {
    return allEpochs.length > 0 ? allEpochs[allEpochs.length - 1] : 100;
  }, [allEpochs]);

  // Range zoom window state
  const [zoomRange, setZoomRange] = useState<[number, number]>([0, 100]);

  // Reset zoomRange when maxEpoch changes
  const [prevMaxEpoch, setPrevMaxEpoch] = useState<number>(100);
  if (maxEpoch !== prevMaxEpoch) {
    setZoomRange([0, maxEpoch]);
    setPrevMaxEpoch(maxEpoch);
  }

  // Find active variant details for global best frame indicators
  const activeVariantData = useMemo(() => {
    const activeId = getObjectIdStr(currentId);
    return plottedVariants.find((v) => getObjectIdStr(v._id) === activeId) || plottedVariants[0];
  }, [plottedVariants, currentId]);

  // Global best frame of the active sequence
  const bestFrame = useMemo(() => {
    if (!activeVariantData) return null;
    const frames = (activeVariantData.interframes || [])
      .filter((f: any) => typeof f.score === "number" && !isNaN(f.score));
    if (frames.length === 0) return null;
    return frames.reduce((prev: any, curr: any) => (curr.score < prev.score ? curr : prev), frames[0]);
  }, [activeVariantData]);

  // Align each variant's data points with the union of all epochs
  const seriesList = useMemo(() => {
    const activeId = getObjectIdStr(currentId);

    return plottedVariants.map((v, index) => {
      const vId = getObjectIdStr(v._id);
      const isActive = vId === activeId || plottedVariants.length === 1;
      const beadAtom = v.metrics?.bead_atom || "Unknown";

      const scoreMap = new Map<number, number>();
      const phaseMap = new Map<number, string>();

      const frames = v.interframes || [];
      frames.forEach((f: any) => {
        const ep = f.epoch !== null && f.epoch !== undefined ? Number(f.epoch) : NaN;
        if (!isNaN(ep) && typeof f.score === "number" && !isNaN(f.score)) {
          scoreMap.set(ep, f.score);
          phaseMap.set(ep, f.phase || "");
        }
      });

      // Align scores to union of epochs
      const seriesData = allEpochs.map((ep) => scoreMap.get(ep) ?? null);

      // Color palette (Emerald for active, distinct colors for others)
      const colors = ["#3b82f6", "#f59e0b", "#ec4899", "#8b5cf6", "#ef4444", "#06b6d4"];
      const color = isActive ? "#10b981" : colors[index % colors.length];

      return {
        id: vId,
        beadAtom,
        isActive,
        data: seriesData,
        color,
        phaseMap,
      };
    });
  }, [plottedVariants, allEpochs, currentId]);

  // Filter visible scores across all series to calculate local Y-axis range
  const visibleDataScores = useMemo(() => {
    const scores: number[] = [];
    seriesList.forEach((s) => {
      allEpochs.forEach((ep, idx) => {
        if (ep >= zoomRange[0] && ep <= zoomRange[1]) {
          const val = s.data[idx];
          if (val !== null) {
            scores.push(val);
          }
        }
      });
    });
    return scores;
  }, [seriesList, allEpochs, zoomRange]);

  const { paddedMaxScore } = useMemo(() => {
    if (visibleDataScores.length === 0) {
      return { paddedMaxScore: 100 };
    }
    const maxS = Math.max(...visibleDataScores);
    const minS = Math.min(...visibleDataScores);
    const range = maxS - minS;
    const padding = range * 0.1 || 1;
    return {
      paddedMaxScore: maxS + padding,
    };
  }, [visibleDataScores]);

  if (allEpochs.length === 0) {
    return (
      <div className="border border-foreground/10 p-6 bg-card flex flex-col items-center justify-center h-[280px]">
        <p className="text-sm text-primary/50">No interframe trajectory data available</p>
      </div>
    );
  }

  // Create single point marker data for the active best frame
  const bestFrameSeriesData = allEpochs.map((ep) =>
    ep === bestFrame?.epoch ? bestFrame.score : null
  );

  return (
    <div className="relative w-full border border-foreground/10 bg-card p-6 overflow-hidden select-none">
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-4">
        <div>
          <h3 className="text-sm font-semibold text-primary/60 uppercase tracking-wider">
            Optimization Trajectory
          </h3>
          <p className="text-xs text-primary/40 font-mono mt-0.5">
            Phase scores mapped across optimization epochs
          </p>
        </div>

        {/* Dynamic Multi-Variant Legend */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-mono">
          {seriesList.map((s) => (
            <div key={s.id} className="flex items-center space-x-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: s.color }}
              ></span>
              <span className={`text-primary/70 ${s.isActive ? "font-bold underline text-emerald-500" : ""}`}>
                {s.beadAtom} {s.isActive ? "(active)" : ""}
              </span>
            </div>
          ))}
          {bestFrame && (
            <div className="flex items-center space-x-1.5 ml-2 border-l border-foreground/15 pl-4">
              <span className="w-2.5 h-2.5 rounded-full border border-emerald-400 bg-emerald-400/20 ring-2 ring-emerald-500/30"></span>
              <span className="text-primary/70">
                Best (active): {bestFrame.score.toFixed(3)} (Ep. {bestFrame.epoch})
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="relative w-full h-[300px]">
        <LineChart
          xAxis={[
            {
              data: allEpochs,
              label: "Epoch",
              scaleType: "linear",
              min: zoomRange[0],
              max: zoomRange[1],
            },
          ]}
          yAxis={[
            {
              min: 0,
              max: paddedMaxScore,
              label: "Score",
            },
          ]}
          series={[
            // Variant Trajectories
            ...seriesList.map((s) => ({
              id: s.id,
              data: s.data,
              label: s.beadAtom,
              area: s.isActive, // only area fill the active variant
              showMark: false,
              color: s.color,
              // Customize stroke thickness per series
              sx: {
                "& .MuiLineElement-root": {
                  strokeWidth: s.isActive ? 3 : 1.5,
                },
              },
              valueFormatter: (value: number | null, context: { dataIndex: number }) => {
                if (value === null) return "";
                const phase = s.phaseMap.get(allEpochs[context.dataIndex]) || "";
                return `${value.toFixed(4)} (Phase ${phase})`;
              },
            })),
            // Best Frame Marker Series
            {
              id: "best-frame-series",
              data: bestFrameSeriesData,
              label: "Best Frame",
              showMark: true,
              color: "#10b981",
              valueFormatter: (value: number | null) => {
                if (value === null) return "";
                return `${value.toFixed(4)} (Best Frame)`;
              },
            },
          ]}
          slots={{
            mark: CustomMark,
          }}
          slotProps={{
            legend: {
              hidden: true,
            },
            tooltip: {
              trigger: "axis",
            },
          }}
          grid={{ horizontal: true, vertical: true }}
          margin={{ top: 20, right: 20, bottom: 45, left: 55 }}
          sx={{
            width: "100%",
            height: "100%",
            // Tick labels
            "& .MuiChartsAxis-tickLabel": {
              fill: "currentColor",
              opacity: 0.6,
              fontFamily: "JetBrains Mono, monospace",
              fontSize: "10px !important",
            },
            // Axis lines
            "& .MuiChartsAxis-line": {
              stroke: "currentColor",
              opacity: 0.15,
            },
            // Tick lines
            "& .MuiChartsAxis-tick": {
              stroke: "currentColor",
              opacity: 0.15,
            },
            // Grid lines
            "& .MuiChartsGrid-line": {
              stroke: "currentColor",
              opacity: 0.08,
              strokeDasharray: "4 4",
            },
            // Axis labels
            "& .MuiChartsAxis-label": {
              fill: "currentColor",
              opacity: 0.6,
              fontFamily: "JetBrains Mono, monospace",
              fontSize: "11px !important",
            },
            // Area fill gradient styling (only applies to active variant)
            "& .MuiAreaElement-root": {
              fill: "url(#area-gradient)",
            },
          }}
        >
          <defs>
            <linearGradient id="area-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#10b981" stopOpacity={0.0} />
            </linearGradient>
          </defs>
        </LineChart>
      </div>

      {/* Zoom Controls */}
      <div className="mt-6 border-t border-foreground/10 pt-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-primary/60 uppercase tracking-wider">
              Zoom Window
            </span>
            <span className="text-xs text-primary/40 font-mono mt-0.5">
              Showing Epoch {zoomRange[0]} to {zoomRange[1]}
            </span>
          </div>

          {/* Preset Buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setZoomRange([0, maxEpoch])}
              className="px-2.5 py-1 text-xs border border-foreground/10 hover:border-primary/30 rounded font-mono transition cursor-pointer"
            >
              Reset
            </button>
            <button
              onClick={() => {
                const start = Math.max(0, Math.round(maxEpoch * 0.5));
                setZoomRange([start, maxEpoch]);
              }}
              className="px-2.5 py-1 text-xs border border-foreground/10 hover:border-primary/30 rounded font-mono transition cursor-pointer"
            >
              Last 50%
            </button>
            <button
              onClick={() => {
                const start = Math.max(0, Math.round(maxEpoch * 0.8));
                setZoomRange([start, maxEpoch]);
              }}
              className="px-2.5 py-1 text-xs border border-foreground/10 hover:border-primary/30 rounded font-mono transition cursor-pointer"
            >
              Last 20%
            </button>
          </div>
        </div>

        {/* MUI Range Slider */}
        <div className="px-2 mt-4">
          <Slider
            value={zoomRange}
            onChange={(_, newValue) => setZoomRange(newValue as [number, number])}
            min={0}
            max={maxEpoch || 1}
            valueLabelDisplay="auto"
            valueLabelFormat={(value) => `Ep. ${value}`}
            sx={{
              color: "#10b981", // Emerald accent color
              "& .MuiSlider-thumb": {
                width: 14,
                height: 14,
                backgroundColor: "#fff",
                border: "2px solid currentColor",
                "&:hover, &.Mui-focusVisible": {
                  boxShadow: "0 0 0 8px rgba(16, 185, 129, 0.16)",
                },
                "&.Mui-active": {
                  boxShadow: "0 0 0 12px rgba(16, 185, 129, 0.24)",
                },
              },
              "& .MuiSlider-track": {
                height: 4,
              },
              "& .MuiSlider-rail": {
                height: 4,
                opacity: 0.2,
                color: "var(--foreground)",
              },
              "& .MuiSlider-valueLabel": {
                fontFamily: "JetBrains Mono, monospace",
                fontSize: "10px",
                backgroundColor: "var(--primary)",
                color: "var(--primary-foreground)",
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
