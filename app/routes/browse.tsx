import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { ClientOnly } from "../components/ClientOnly";
import { ThemeToggle } from "../components/ThemeToggle";
import PillNav from "../components/PillNav";
import Footer from "../components/Footer";

export function meta() {
  return [
    { title: "Browse - BEPS" },
    { name: "description", content: "Browse all RNA sequences" },
  ];
}

export default function Browse() {
  const [sequences, setSequences] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [scoreMax, setScoreMax] = useState<string>("");
  const [organism, setOrganism] = useState<string>("");
  const [method, setMethod] = useState<string>("");
  const navigate = useNavigate();

  const navItems = [
    { label: "Home", href: "/" },
    { label: "Browse", href: "/browse" },
  ];

  useEffect(() => {
    fetch("http://localhost:8000/sequences/?limit=100&skip=0")
      .then(res => res.json())
      .then((data: any) => {
        setSequences(data);
        setFiltered(data);
      })
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    let result = sequences;

    if (scoreMax !== "") {
      result = result.filter((s: any) =>
        s.metrics?.final_score <= parseFloat(scoreMax)
      );
    }

    if (organism !== "") {
      result = result.filter((s: any) =>
        s.organism?.toLowerCase().includes(organism.toLowerCase())
      );
    }

    if (method !== "") {
      result = result.filter((s: any) =>
        s.metrics?.methods?.toLowerCase().includes(method.toLowerCase())
      );
    }

    setFiltered(result);
  }, [scoreMax, organism, method, sequences]);

  const organisms = [...new Set(sequences.map((s: any) => s.organism).filter(Boolean))];
  const methods = [...new Set(sequences.map((s: any) => s.metrics?.methods).filter(Boolean))];

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

      <div className="max-w-6xl mx-auto p-8 pt-20">
        <h1 className="text-4xl font-bold text-center text-foreground mb-2">
          Browse sequences
        </h1>
        <p className="text-center text-foreground/60 mb-8">
          All RNA sequences computed by BEPS
        </p>

        {/* Filtres */}
        <div className="flex gap-4 mb-8 flex-wrap">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-foreground/50 font-medium">Max score</label>
            <input
              type="number"
              step="0.01"
              placeholder="e.g. 0.5"
              value={scoreMax}
              onChange={e => setScoreMax(e.target.value)}
              className="px-3 py-2 border border-foreground/20 rounded-lg bg-background text-foreground text-sm w-32 outline-none"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-foreground/50 font-medium">Organism</label>
            <select
              value={organism}
              onChange={e => setOrganism(e.target.value)}
              className="px-3 py-2 border border-foreground/20 rounded-lg bg-background text-foreground text-sm w-48 outline-none"
            >
              <option value="">All organisms</option>
              {organisms.map((org: any, i) => (
                <option key={i} value={org}>{org}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-foreground/50 font-medium">Method</label>
            <select
              value={method}
              onChange={e => setMethod(e.target.value)}
              className="px-3 py-2 border border-foreground/20 rounded-lg bg-background text-foreground text-sm w-48 outline-none"
            >
              <option value="">All methods</option>
              {methods.map((m: any, i) => (
                <option key={i} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* Reset */}
          {(scoreMax || organism || method) && (
            <div className="flex flex-col gap-1 justify-end">
              <button
                onClick={() => { setScoreMax(""); setOrganism(""); setMethod(""); }}
                className="px-3 py-2 border border-foreground/20 rounded-lg text-foreground/50 hover:text-foreground text-sm transition"
              >
                Reset filters
              </button>
            </div>
          )}

          <div className="flex flex-col gap-1 justify-end ml-auto">
            <p className="text-xs text-foreground/40">{filtered.length} results</p>
          </div>
        </div>

        {/* Tableau */}
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-foreground/10">
              <th className="text-left py-3 px-4 text-sm font-medium text-foreground/60">Sequence</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-foreground/60">Name</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-foreground/60">Organism</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-foreground/60">Score</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-foreground/60">Method</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-foreground/60">Date</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((seq: any, index: number) => (
              <tr
                key={index}
                onClick={() => navigate(`/sequence/${seq._id}`)}
                className="border-b border-foreground/5 hover:bg-foreground/5 transition cursor-pointer"
              >
                <td className="py-3 px-4 text-sm font-mono text-foreground">
                  {seq.sequence?.substring(0, 20)}...
                </td>
                <td className="py-3 px-4 text-sm text-foreground/70">{seq.name || "—"}</td>
                <td className="py-3 px-4 text-sm text-foreground/70">{seq.organism || "—"}</td>
                <td className="py-3 px-4 text-sm text-foreground">
                  {seq.metrics?.final_score?.toFixed(3) || "—"}
                </td>
                <td className="py-3 px-4 text-sm text-foreground/70">
                  {seq.metrics?.methods || "—"}
                </td>
                <td className="py-3 px-4 text-sm text-foreground/70">{seq.date || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Footer />
    </div>
  );
}