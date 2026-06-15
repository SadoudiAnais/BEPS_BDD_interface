import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import { ClientOnly } from "../components/ClientOnly";
import { ThemeToggle } from "../components/ThemeToggle";
import PillNav from "../components/PillNav";
import Footer from "../components/Footer";

export function meta() {
  return [
    { title: "Browse - ErFold-RNAWann" },
    { name: "description", content: "Browse all RNA sequences" },
  ];
}

export default function Browse() {
  const [sequences, setSequences] = useState<any[]>([]);
  const [search, setSearch] = useState<string>("");
  const [scoreMax, setScoreMax] = useState<string>("");
  const [organism, setOrganism] = useState<string>("");
  const [beadAtom, setBeadAtom] = useState<string>("");
  const [sortKey, setSortKey] = useState<string>("score");
  const [sortAsc, setSortAsc] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const navItems = [
    { label: "Home", href: "/" },
    { label: "Browse", href: "/browse" },
    { label: "About", href: "/about" },
  ];

  useEffect(() => {
    fetch("https://api.paulverot.fr/sequences/?limit=1000&skip=0")
      .then(res => {
        if (!res.ok) throw new Error(`API returned status ${res.status}`);
        return res.json();
      })
      .then((data: any) => setSequences(data))
      .catch(err => setError(err.message));
  }, []);

  // Group sequences by name (fallback to sequence) — one row per unique sequence
  const grouped = useMemo(() => {
    const groups = new Map<string, any[]>();
    sequences.forEach((seq: any) => {
      const key = seq.name || seq.sequence || seq._id;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(seq);
    });

    return Array.from(groups.values()).map((variants) => {
      const best = variants.reduce((prev: any, curr: any) => {
        const prevScore = prev.metrics?.final_score ?? Infinity;
        const currScore = curr.metrics?.final_score ?? Infinity;
        return currScore < prevScore ? curr : prev;
      });
      const beadAtoms = [...new Set(variants.map((v: any) => v.metrics?.bead_atom).filter(Boolean))] as string[];
      return { variants, best, beadAtoms };
    });
  }, [sequences]);

  const organisms = [...new Set(sequences.map((s: any) => s.organism).filter(Boolean))];
  const allBeadAtoms = [...new Set(sequences.map((s: any) => s.metrics?.bead_atom).filter(Boolean))] as string[];

  const filtered = useMemo(() => {
    let result = grouped;

    if (search !== "") {
      result = result.filter((g) =>
        g.best.name?.toLowerCase().includes(search.toLowerCase()) ||
        g.best.organism?.toLowerCase().includes(search.toLowerCase()) ||
        g.best.sequence?.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (scoreMax !== "") {
      result = result.filter((g) => (g.best.metrics?.final_score ?? Infinity) <= parseFloat(scoreMax));
    }
    if (organism !== "") {
      result = result.filter((g) => g.best.organism?.toLowerCase().includes(organism.toLowerCase()));
    }
    if (beadAtom !== "") {
      result = result.filter((g) => g.beadAtoms.includes(beadAtom));
    }

    result = [...result].sort((a, b) => {
      let valA: any, valB: any;
      switch (sortKey) {
        case "length":
          valA = a.best.metrics?.length ?? a.best.sequence?.length ?? 0;
          valB = b.best.metrics?.length ?? b.best.sequence?.length ?? 0;
          break;
        case "name":
          valA = a.best.name || "";
          valB = b.best.name || "";
          break;
        case "organism":
          valA = a.best.organism || "";
          valB = b.best.organism || "";
          break;
        case "score":
        default:
          valA = a.best.metrics?.final_score ?? Infinity;
          valB = b.best.metrics?.final_score ?? Infinity;
          break;
      }
      if (typeof valA === "string") return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      return sortAsc ? valA - valB : valB - valA;
    });

    return result;
  }, [grouped, search, scoreMax, organism, beadAtom, sortKey, sortAsc]);

  const handleSort = (key: string) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
  };

  const SortIcon = ({ k }: { k: string }) => (
    <span className="ml-1 text-foreground/30">
      {sortKey === k ? (sortAsc ? "↑" : "↓") : "↕"}
    </span>
  );

  const ScoreBadge = ({ score }: { score: number }) => {
    const color = score < 0.3
      ? "bg-green-100 text-green-700"
      : score < 0.6
      ? "bg-amber-100 text-amber-700"
      : "bg-red-100 text-red-700";
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-bold ${color}`}>
        {score.toFixed(3)}
      </span>
    );
  };

  return (
    <div className="bg-background text-foreground min-h-screen">
      <ClientOnly>
        <PillNav
          logo="/favicon.ico"
          logoAlt="ErFold-RNAWann"
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
          All RNA sequences computed by ErFold-RNAWann
        </p>

        {error && (
          <div className="text-center text-red-500 mb-8 font-semibold">
            {error}. Please try again later.
          </div>
        )}

        <div className="flex gap-4 mb-4 flex-wrap items-end">
          <div className="flex-1 min-w-64">
            <input
              type="text"
              placeholder="Search by name or organism..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full px-4 py-2.5 border border-foreground/20 rounded-lg bg-background text-foreground text-sm outline-none"
            />
          </div>
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
            <label className="text-xs text-foreground/50 font-medium">Bead atom</label>
            <select
              value={beadAtom}
              onChange={e => setBeadAtom(e.target.value)}
              className="px-3 py-2 border border-foreground/20 rounded-lg bg-background text-foreground text-sm w-32 outline-none"
            >
              <option value="">All</option>
              {allBeadAtoms.map((atom, i) => (
                <option key={i} value={atom}>{atom}</option>
              ))}
            </select>
          </div>
          {(search || scoreMax || organism || beadAtom) && (
            <button
              onClick={() => { setSearch(""); setScoreMax(""); setOrganism(""); setBeadAtom(""); }}
              className="px-3 py-2 border border-foreground/20 rounded-lg text-foreground/50 hover:text-foreground text-sm transition"
            >
              Reset
            </button>
          )}
        </div>

        <p className="text-xs text-foreground/40 mb-4 text-right">
          Showing {filtered.length} of {grouped.length} sequences
        </p>

        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-foreground/10">
              <th className="text-left py-3 px-4 text-xs font-medium text-foreground/60 uppercase tracking-wider cursor-pointer hover:text-foreground" onClick={() => handleSort("length")}>
                Length <SortIcon k="length" />
              </th>
              <th className="text-left py-3 px-4 text-xs font-medium text-foreground/60 uppercase tracking-wider cursor-pointer hover:text-foreground" onClick={() => handleSort("name")}>
                Name <SortIcon k="name" />
              </th>
              <th className="text-left py-3 px-4 text-xs font-medium text-foreground/60 uppercase tracking-wider cursor-pointer hover:text-foreground" onClick={() => handleSort("organism")}>
                Organism <SortIcon k="organism" />
              </th>
              <th className="text-left py-3 px-4 text-xs font-medium text-foreground/60 uppercase tracking-wider">Variants</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-foreground/60 uppercase tracking-wider cursor-pointer hover:text-foreground" onClick={() => handleSort("score")}>
                Best Score <SortIcon k="score" />
              </th>
              <th className="text-left py-3 px-4 text-xs font-medium text-foreground/60 uppercase tracking-wider">Version</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-foreground/60 uppercase tracking-wider">Date</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((g, index: number) => (
              <tr
                key={index}
                onClick={() => navigate(`/sequence/${g.best._id}`)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    navigate(`/sequence/${g.best._id}`);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label={`View details for ${g.best.name || "unnamed"}`}
                className="border-b border-foreground/5 hover:bg-foreground/5 transition cursor-pointer"
              >
                <td className="py-3 px-4">
                  <span className="px-2 py-0.5 border border-foreground/20 rounded text-xs font-mono text-foreground/70">
                    {g.best.metrics?.length || g.best.sequence?.length || "—"}
                  </span>
                </td>
                <td className="py-3 px-4 text-sm text-foreground max-w-xs truncate">{g.best.name || "—"}</td>
                <td className="py-3 px-4 text-sm text-foreground/60 italic">{g.best.organism || "N/A"}</td>
                <td className="py-3 px-4">
                  <div className="flex gap-1 flex-wrap">
                    {g.beadAtoms.length > 0 ? g.beadAtoms.map((atom: string) => (
                      <span key={atom} className="px-1.5 py-0.5 border border-foreground/20 rounded text-[10px] font-mono text-foreground/60">
                        {atom}
                      </span>
                    )) : <span className="text-foreground/40 text-xs">—</span>}
                  </div>
                </td>
                
                <td className="py-3 px-4">
                  {g.best.metrics?.final_score !== undefined ? <ScoreBadge score={g.best.metrics.final_score} /> : "—"}
                </td>
                <td className="py-3 px-4 text-sm text-foreground/60">v{g.best.vers || "1.0"}</td>
                <td className="py-3 px-4 text-sm text-foreground/60">{g.best.date || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Footer />
    </div>
  );
}