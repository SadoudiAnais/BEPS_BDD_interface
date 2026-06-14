import { useParams, useNavigate, useLoaderData } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { useState, useEffect, useMemo } from "react";
import { ClientOnly } from "../components/ClientOnly";
import { ThemeToggle } from "../components/ThemeToggle";
import PillNav from "../components/PillNav";
import Footer from "../components/Footer";
import { MolstarViewer } from "../components/MolstarViewer";
import { VideoPlayer } from "../components/VideoPlayer";
import { TrajectoryPlot } from "../components/TrajectoryPlot";
import { ContactMap } from "../components/ContactMap";

export function meta() {
  return [
    { title: "Sequence - BEPS" },
    { name: "description", content: "Sequence details" },
  ];
}

export async function loader({ params }: LoaderFunctionArgs) {
  try {
    const res = await fetch(`https://api.paulverot.fr/sequences/${params.id}`);
    if (!res.ok) {
      return { sequence: null, variants: [] as any[], error: `API returned status ${res.status}` };
    }
    const sequence = (await res.json()) as any;

    let variants: any[] = [];
    try {
      const allRes = await fetch("https://api.paulverot.fr/sequences/?limit=1000&skip=0");
      if (allRes.ok) {
        const allSequences = await allRes.json();
        if (Array.isArray(allSequences)) {
          variants = allSequences.filter(
            (s: any) =>
              (s.name && sequence.name && s.name === sequence.name) ||
              (s.sequence && sequence.sequence && s.sequence === sequence.sequence)
          );
        }
      }
    } catch (err) {
      console.error("Failed to fetch sequence variants list:", err);
    }

    if (variants.length === 0) {
      variants = [sequence];
    }

    return { sequence: sequence as any, variants, error: null as string | null };
  } catch (error: any) {
    console.error("Loader fetch error for sequence details:", error);
    return { sequence: null, variants: [] as any[], error: (error.message || "Failed to fetch sequence") as string | null };
  }
}

export default function Sequence() {
  const { sequence, variants, error } = useLoaderData<typeof loader>();
  const { id } = useParams();
  const navigate = useNavigate();
  const [showAllInterframes, setShowAllInterframes] = useState(false);
  const [SeqVizComponent, setSeqVizComponent] = useState<any>(null);

  const uniqueBeadAtoms = useMemo(() => {
    const atoms = (variants || [])
      .map((v: any) => v.metrics?.bead_atom)
      .filter((atom: any) => typeof atom === "string" && atom.trim() !== "");
    return Array.from(new Set(atoms)) as string[];
  }, [variants]);

  const currentBeadAtom = sequence?.metrics?.bead_atom || "";
  const currentVersion = sequence?.vers || "";

  const availableVersions = useMemo(() => {
    return (variants || [])
      .filter((v: any) => v.metrics?.bead_atom === currentBeadAtom)
      .map((v: any) => v.vers || "1.0")
      .filter((v, i, self) => self.indexOf(v) === i);
  }, [variants, currentBeadAtom]);

  const handleBeadAtomChange = (newBeadAtom: string) => {
    if (newBeadAtom === currentBeadAtom) return;
    const newAtomVariants = (variants || []).filter(
      (v: any) => v.metrics?.bead_atom === newBeadAtom
    );
    if (newAtomVariants.length === 0) return;

    let targetVariant = newAtomVariants.find((v: any) => (v.vers || "1.0") === currentVersion);
    if (!targetVariant) {
      targetVariant = newAtomVariants[0];
    }

    if (targetVariant && targetVariant._id) {
      navigate(`/sequence/${targetVariant._id}`);
    }
  };

  const handleVersionChange = (newVersion: string) => {
    if (newVersion === currentVersion) return;
    const targetVariant = (variants || []).find(
      (v: any) => v.metrics?.bead_atom === currentBeadAtom && (v.vers || "1.0") === newVersion
    );

    if (targetVariant && targetVariant._id) {
      navigate(`/sequence/${targetVariant._id}`);
    }
  };

  useEffect(() => {
    import("seqviz")
      .then((mod) => {
        setSeqVizComponent(() => mod.SeqViz);
      })
      .catch((err) => {
        console.error("Failed to load seqviz dynamically:", err);
      });
  }, []);

  const navItems = [
    { label: "Browse", href: "/browse" },
  ];

  return (
    <div className="bg-background text-primary min-h-screen">
      <ClientOnly>
        <PillNav
          logo="/favicon.ico"
          logoAlt="Logo"
          logoHref="https://www.ibisc.univ-evry.fr/en/"
          items={navItems}
          activeHref="/browse"
          baseColor="var(--nav-base)"
          pillColor="var(--nav-pill-bg)"
          pillTextColor="var(--nav-pill-text)"
          hoveredPillTextColor="var(--nav-hover-text)"
          hoverPillColor="var(--nav-hover-bg)"
        />
      </ClientOnly>

      <div className="fixed top-4 right-4 flex items-center space-x-4 z-40">
        <ThemeToggle />
      </div>

      <div className="max-w-4xl mx-auto p-8 pt-20">

        <button
          onClick={() => navigate("/browse")}
          className="text-sm text-primary/50 hover:text-primary transition mb-6 flex items-center gap-1"
          aria-label="Back to browse page"
        >
          ← Back to Browse
        </button>

        {error ? (
          <div className="text-center">
            <p className="text-red-500 mb-4 font-semibold">{error}</p>
            <p className="text-primary/50">Please try again later.</p>
          </div>
        ) : !sequence ? (
          <p className="text-center text-primary/50">Sequence not found</p>
        ) : (
          <div>
            <h1 className="text-2xl font-bold text-primary mb-2 font-mono">
              {sequence.name}
            </h1>
            <p className="text-primary/50 text-sm mb-8 break-all">
              {sequence.sequence}
            </p>

            <div className="border border-foreground/10 rounded-lg p-6 mb-8 bg-card shadow-sm">
              <h2 className="text-lg font-bold text-primary mb-4">Sequence Visualisation</h2>
              <ClientOnly>
                {SeqVizComponent ? (
                  <div className="h-[400px] w-full">
                    <SeqVizComponent
                      name={sequence.name || "Sequence"}
                      seq={sequence.sequence}
                      viewer="linear"
                      annotations={
                        sequence.sequence && sequence.sequence.length > 0
                          ? [
                            {
                              name: "RNA Sequence",
                              start: 0,
                              end: sequence.sequence.length,
                              direction: 1,
                              color: "#0a3d67"
                            }
                          ]
                          : []
                      }
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[200px]">
                    <span className="animate-pulse text-sm text-primary/50">Loading sequence viewer...</span>
                  </div>
                )}
              </ClientOnly>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="border border-foreground/10 rounded-lg p-4">
                <p className="text-xs text-primary/40 mb-1">Organism</p>
                <p className="text-sm font-medium text-primary">{sequence.organism || "—"}</p>
              </div>
              <div className="border border-foreground/10 rounded-lg p-4">
                <p className="text-xs text-primary/40 mb-1">Date</p>
                <p className="text-sm font-medium text-primary">{sequence.date || "—"}</p>
              </div>
            </div>

            <h2 className="text-lg font-bold text-primary mb-4">Metrics</h2>
            <div className="grid grid-cols-4 gap-4 mb-8">
              <div className="border border-foreground/10 rounded-lg p-4">
                <p className="text-xs text-primary/40 mb-1">Final score</p>
                <p className="text-xl font-bold text-primary">{sequence.metrics?.final_score?.toFixed(3) || "—"}</p>
              </div>
              <div className="border border-foreground/10 rounded-lg p-4">
                <p className="text-xs text-primary/40 mb-1">Method</p>
                <p className="text-sm font-medium text-primary">{sequence.metrics?.methods || "—"}</p>
              </div>
              <div className="border border-foreground/10 rounded-lg p-4 flex flex-col justify-between min-h-[76px]">
                <p className="text-xs text-primary/40 mb-1">Bead atom</p>
                {uniqueBeadAtoms.length > 1 ? (
                  <select
                    value={currentBeadAtom}
                    onChange={(e) => handleBeadAtomChange(e.target.value)}
                    className="w-full bg-background border border-foreground/20 rounded-lg px-2 py-1 text-xs text-primary focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 transition cursor-pointer hover:bg-foreground/5"
                  >
                    {uniqueBeadAtoms.map((atom) => (
                      <option key={atom} value={atom}>
                        {atom}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-sm font-medium text-primary">{currentBeadAtom || "—"}</p>
                )}
              </div>
              <div className="border border-foreground/10 rounded-lg p-4 flex flex-col justify-between min-h-[76px]">
                <p className="text-xs text-primary/40 mb-1">Version</p>
                {availableVersions.length > 1 ? (
                  <select
                    value={currentVersion}
                    onChange={(e) => handleVersionChange(e.target.value)}
                    className="w-full bg-background border border-foreground/20 rounded-lg px-2 py-1 text-xs text-primary focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 transition cursor-pointer hover:bg-foreground/5"
                  >
                    {availableVersions.map((v) => (
                      <option key={v} value={v}>
                        v{v}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-sm font-medium text-primary">v{currentVersion || "1.0"}</p>
                )}
              </div>
              <div className="border border-foreground/10 rounded-lg p-4">
                <p className="text-xs text-primary/40 mb-1">Length</p>
                <p className="text-sm font-medium text-primary">{sequence.metrics?.length || "—"}</p>
              </div>
              <div className="border border-foreground/10 rounded-lg p-4">
                <p className="text-xs text-primary/40 mb-1">Time (s)</p>
                <p className="text-sm font-medium text-primary">{sequence.metrics?.time?.toFixed(2) || "—"}</p>
              </div>
              <div className="border border-foreground/10 rounded-lg p-4">
                <p className="text-xs text-primary/40 mb-1">Potential</p>
                <p className="text-sm font-medium text-primary">{sequence.metrics?.potential?.toFixed(3) || "—"}</p>
              </div>
              <div className="border border-foreground/10 rounded-lg p-4">
                <p className="text-xs text-primary/40 mb-1">Bond</p>
                <p className="text-sm font-medium text-primary">{sequence.metrics?.bond?.toFixed(3) || "—"}</p>
              </div>
              <div className="border border-foreground/10 rounded-lg p-4">
                <p className="text-xs text-primary/40 mb-1">Score function</p>
                <p className="text-sm font-medium text-primary">{sequence.metrics?.score_function || "—"}</p>
              </div>
            </div>

            <div className="mb-8" aria-label="Interactive 3D molecular structure viewer" role="region">
              <h2 className="text-lg font-bold text-primary mb-4">3D Structure</h2>
              <ClientOnly>
                <MolstarViewer url={`/api/pdb/${id}`} format="pdb" />
              </ClientOnly>
              <div className="mt-4">
                <a
                  href={`https://api.paulverot.fr/sequences/${id}/pdb`}
                  target="_blank"
                  className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition text-sm"
                 >
                  Download PDB file ↓
                </a>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-lg font-bold text-primary mb-4">Folding Animation</h2>
              <ClientOnly>
                <VideoPlayer src={`https://api.paulverot.fr/sequences/${id}/video`} />
              </ClientOnly>
              <div className="mt-4">
                <a
                  href={`https://api.paulverot.fr/sequences/${id}/video`}
                  target="_blank"
                  className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition text-sm"
                >
                  Download Video file ↓
                </a>
              </div>
            </div>

            <div className="mb-8">
              <TrajectoryPlot
                interframes={sequence.interframes || []}
                currentId={id || ""}
                variants={variants || []}
              />
            </div>

            <div className="mb-8">
              <ClientOnly>
                <ContactMap sequenceId={id || ""} sequenceString={sequence.sequence || ""} />
              </ClientOnly>
            </div>

            <h2 className="text-lg font-bold text-primary mb-4">
              Interframes ({sequence.interframes?.length || 0} steps)
            </h2>
            {(() => {
              const allInterframes = sequence.interframes || [];
              const finalFrame = allInterframes.length > 0 && allInterframes[allInterframes.length - 1].phase === "final"
                ? allInterframes[allInterframes.length - 1]
                : null;
              const interframes = finalFrame
                ? allInterframes.slice(0, -1)
                : allInterframes;

              const scores = interframes
                .map((f: any) => f.score)
                .filter((s: any) => typeof s === "number" && !isNaN(s));
              const minScore = scores.length > 0 ? Math.min(...scores) : 0;
              const maxScore = scores.length > 0 ? Math.max(...scores) : 0;
              const scoreRange = maxScore - minScore;

              const bestFrame = interframes.find((f: any) => f.score === minScore);
              const bestEpoch = bestFrame ? bestFrame.epoch : (finalFrame ? finalFrame.epoch : "—");

              const count = scores.length;
              const sum = scores.reduce((a: number, b: number) => a + b, 0);
              const avgScore = count > 0 ? sum / count : 0;

              const variance = count > 0
                ? scores.reduce((a: number, b: number) => a + Math.pow(b - avgScore, 2), 0) / count
                : 0;
              const stdDev = Math.sqrt(variance);

              const initialScore = scores.length > 0 ? scores[0] : 0;
              const improvement = initialScore - minScore;
              const improvementPercent = initialScore > 0 ? (improvement / initialScore) * 100 : 0;

              return (
                <>
                  {finalFrame && (
                    <div className="mb-6 p-4 border border-foreground rounded-lg bg-background flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-primary/60 uppercase tracking-wider">Final Optimized Structure</h3>
                        <p className="text-xs text-primary/50 font-mono mt-1">Epoch {bestEpoch} • Best Score</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-primary/60 block">Score</span>
                        <p className="text-2xl font-black text-primary/60">{finalFrame.score?.toFixed(3)}</p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="border border-foreground/10 rounded-lg p-4 bg-foreground/2">
                      <p className="text-xs text-primary/40 mb-1 font-semibold uppercase tracking-wider">Average Score</p>
                      <p className="text-lg font-bold text-primary font-mono">{avgScore.toFixed(3)}</p>
                    </div>
                    <div className="border border-foreground/10 rounded-lg p-4 bg-foreground/2">
                      <p className="text-xs text-primary/40 mb-1 font-semibold uppercase tracking-wider">Std Deviation</p>
                      <p className="text-lg font-bold text-primary font-mono">{stdDev.toFixed(3)}</p>
                    </div>
                    <div className="border border-foreground/10 rounded-lg p-4 bg-foreground/2">
                      <p className="text-xs text-primary/40 mb-1 font-semibold uppercase tracking-wider">Score Drop</p>
                      <p className="text-lg font-bold font-mono">-{improvement.toFixed(3)}</p>
                    </div>
                    <div className="border border-foreground/10 rounded-lg p-4 bg-foreground/2">
                      <p className="text-xs text-primary/40 mb-1 font-semibold uppercase tracking-wider">Improvement</p>
                      <p className="text-lg font-bold font-mono">{improvementPercent.toFixed(1)}%</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {(showAllInterframes
                      ? interframes
                      : interframes.slice(0, 24)
                    ).map((frame: any, index: number) => {
                      const frameScore = frame.score ?? 0;
                      const t = scoreRange > 0 ? (frameScore - minScore) / scoreRange : 0;
                      const hue = Math.max(0, Math.min(130, (1 - t) * 130));
                      const isBest = frameScore === minScore;

                      return (
                        <div
                          key={index}
                          className={`flex flex-col p-3 border rounded-lg transition text-center relative ${isBest ? "ring-1 ring-emerald-500" : ""
                            }`}
                          style={{
                            borderColor: "oklch(var(--foreground) / 0.1)",
                            backgroundColor: isBest ? "rgba(16, 185, 129, 0.08)" : "oklch(var(--background))",
                          }}
                        >
                          {isBest && (
                            <span className="absolute -top-2 -right-2 bg-emerald-500 text-white text-[9px] font-bold px-1.5 py-0.5 shadow-sm">
                              Best
                            </span>
                          )}
                          <div className="text-[10px] uppercase tracking-wider text-primary/70 mb-1 font-semibold">
                            Phase {frame.phase}
                          </div>
                          <div className="text-sm font-mono text-primary/70 mb-1">
                            Ep. {frame.epoch}
                          </div>
                          <div
                            className="text-sm font-bold"
                            style={{ color: `hsl(${hue}, 80%, 45%)` }}
                          >
                            {frameScore.toFixed(3)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {interframes.length > 24 && (
                    <div className="mt-4 text-center">
                      <button
                        onClick={() => setShowAllInterframes(!showAllInterframes)}
                        className="px-4 py-2 border border-foreground/15 hover:border-primary/30 rounded-lg text-sm font-medium transition cursor-pointer"
                      >
                        {showAllInterframes ? "Show Less" : `Show All (${interframes.length})`}
                      </button>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}