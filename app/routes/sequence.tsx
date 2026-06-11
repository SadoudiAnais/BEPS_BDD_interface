import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { ClientOnly } from "../components/ClientOnly";
import { ThemeToggle } from "../components/ThemeToggle";
import PillNav from "../components/PillNav";
import Footer from "../components/Footer";

export function meta() {
  return [
    { title: "Sequence - BEPS" },
    { name: "description", content: "Sequence details" },
  ];
}

export default function Sequence() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sequence, setSequence] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const navItems = [
    { label: "Browse", href: "/browse" },
  ];

  useEffect(() => {
    fetch(`https://api.paulverot.fr/sequences/${id}`)
      .then(res => res.json())
      .then((data: any) => {
        setSequence(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  return (
    <div className="bg-background text-foreground min-h-screen">
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
          className="text-sm text-foreground/50 hover:text-foreground transition mb-6 flex items-center gap-1"
        >
          ← Back to Browse
        </button>

        {loading ? (
          <p className="text-center text-foreground/50">Loading...</p>
        ) : !sequence ? (
          <p className="text-center text-foreground/50">Sequence not found</p>
        ) : (
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2 font-mono">
              {sequence.sequence}
            </h1>
            <p className="text-foreground/50 text-sm mb-8">
              {sequence.name}
            </p>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="border border-foreground/10 rounded-lg p-4">
                <p className="text-xs text-foreground/40 mb-1">Organism</p>
                <p className="text-sm font-medium text-foreground">{sequence.organism || "—"}</p>
              </div>
              <div className="border border-foreground/10 rounded-lg p-4">
                <p className="text-xs text-foreground/40 mb-1">Version</p>
                <p className="text-sm font-medium text-foreground">{sequence.vers || "—"}</p>
              </div>
              <div className="border border-foreground/10 rounded-lg p-4">
                <p className="text-xs text-foreground/40 mb-1">Date</p>
                <p className="text-sm font-medium text-foreground">{sequence.date || "—"}</p>
              </div>
            </div>

            <h2 className="text-lg font-bold text-foreground mb-4">Metrics</h2>
            <div className="grid grid-cols-4 gap-4 mb-8">
              <div className="border border-foreground/10 rounded-lg p-4">
                <p className="text-xs text-foreground/40 mb-1">Final score</p>
                <p className="text-xl font-bold text-foreground">{sequence.metrics?.final_score?.toFixed(3) || "—"}</p>
              </div>
              <div className="border border-foreground/10 rounded-lg p-4">
                <p className="text-xs text-foreground/40 mb-1">Method</p>
                <p className="text-sm font-medium text-foreground">{sequence.metrics?.methods || "—"}</p>
              </div>
              <div className="border border-foreground/10 rounded-lg p-4">
                <p className="text-xs text-foreground/40 mb-1">Bead atom</p>
                <p className="text-sm font-medium text-foreground">{sequence.metrics?.bead_atom || "—"}</p>
              </div>
              <div className="border border-foreground/10 rounded-lg p-4">
                <p className="text-xs text-foreground/40 mb-1">Length</p>
                <p className="text-sm font-medium text-foreground">{sequence.metrics?.length || "—"}</p>
              </div>
              <div className="border border-foreground/10 rounded-lg p-4">
                <p className="text-xs text-foreground/40 mb-1">Time (s)</p>
                <p className="text-sm font-medium text-foreground">{sequence.metrics?.time?.toFixed(2) || "—"}</p>
              </div>
              <div className="border border-foreground/10 rounded-lg p-4">
                <p className="text-xs text-foreground/40 mb-1">Potential</p>
                <p className="text-sm font-medium text-foreground">{sequence.metrics?.potential?.toFixed(3) || "—"}</p>
              </div>
              <div className="border border-foreground/10 rounded-lg p-4">
                <p className="text-xs text-foreground/40 mb-1">Bond</p>
                <p className="text-sm font-medium text-foreground">{sequence.metrics?.bond?.toFixed(3) || "—"}</p>
              </div>
              <div className="border border-foreground/10 rounded-lg p-4">
                <p className="text-xs text-foreground/40 mb-1">Score function</p>
                <p className="text-sm font-medium text-foreground">{sequence.metrics?.score_function || "—"}</p>
              </div>
            </div>

            <div className="mb-8">
              <a
                href={`https://api.paulverot.fr/sequences/${id}/pdb`}
                target="_blank"
                className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition text-sm"
              >
                Download PDB file ↓
              </a>
            </div>

            <h2 className="text-lg font-bold text-foreground mb-4">
              Interframes ({sequence.interframes?.length || 0} steps)
            </h2>
            <div className="border border-foreground/10 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-foreground/10 bg-foreground/5">
                    <th className="text-left py-2 px-4 text-xs font-medium text-foreground/50">Phase</th>
                    <th className="text-left py-2 px-4 text-xs font-medium text-foreground/50">Epoch</th>
                    <th className="text-left py-2 px-4 text-xs font-medium text-foreground/50">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {sequence.interframes?.slice(0, 20).map((frame: any, index: number) => (
                    <tr key={index} className="border-b border-foreground/5">
                      <td className="py-2 px-4 text-sm text-foreground/70">{frame.phase}</td>
                      <td className="py-2 px-4 text-sm text-foreground/70">{frame.epoch}</td>
                      <td className="py-2 px-4 text-sm text-foreground">{frame.score?.toFixed(3)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}