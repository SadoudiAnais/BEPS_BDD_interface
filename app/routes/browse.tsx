import { useState, useEffect } from "react";
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
  const [filtered, setFiltered] = useState<any[]>([]);
  const [search, setSearch] = useState<string>("");
  const [scoreMax, setScoreMax] = useState<string>("");
  const [organism, setOrganism] = useState<string>("");
  const [sortKey, setSortKey] = useState<string>("metrics.final_score");
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
      .then((data: any) => {
        setSequences(data);
        setFiltered(data);
      })
      .catch(err => setError(err.message));
  }, []);

  useEffect(() => {
    let result = sequences;
    if (search !== "") {
      result = result.filter((s: any) =>
        s.name?.toLowerCase().includes(search.toLowerCase()) ||
        s.organism?.toLowerCase().includes(search.toLowerCase()) ||
        s.sequence?.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (scoreMax !== "") {
      result = result.filter((s: any) => s.metrics?.final_score <= parseFloat(scoreMax));
    }
    if (organism !== "") {
      result = result.filter((s: any) => s.organism?.toLowerCase().includes(organism.toLowerCase()));
    }
    result = [...result].sort((a: any, b: any) => {
      let valA = sortKey === "metrics.final_score" ? a.metrics?.final_score : a[sortKey];
      let valB = sortKey === "metrics.final_score" ? b.metrics?.final_score : b[sortKey];
      if (valA === undefined) return 1;
      if (valB === undefined) return -1;
      if (typeof valA === "string") return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      return sortAsc ? valA - valB : valB - valA;
    });
    setFiltered(result);
  }, [search, scoreMax, organism, sortKey, sortAsc, sequences]);

  const organisms = [...new Set(sequences.map((s: any) => s.organism).filter(Boolean))];

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
          {(search || scoreMax || organism) && (
            <button
              onClick={() => { setSearch(""); setScoreMax(""); setOrganism(""); }}
              className="px-3 py-2 border border-foreground/20 rounded-lg text-foreground/50 hover:text-foreground text-sm transition"
            >
              Reset
            </button>
          )}
        </div>

        <p className="text-xs text-foreground/40 mb-4 text-right">
          Showing {filtered.length} of {sequences.length} sequences
        </p>

        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-foreground/10">
              <th className="text-left py-3 px-4 text-xs font-medium text-foreground/60 uppercase tracking-wider cursor-pointer hover:text-foreground" onClick={() => handleSort("metrics.length")}>
                Length <SortIcon k="metrics.length" />
              </th>
              <th className="text-left py-3 px-4 text-xs font-medium text-foreground/60 uppercase tracking-wider cursor-pointer hover:text-foreground" onClick={() => handleSort("name")}>
                Name <SortIcon k="name" />
              </th>
              <th className="text-left py-3 px-4 text-xs font-medium text-foreground/60 uppercase tracking-wider cursor-pointer hover:text-foreground" onClick={() => handleSort("organism")}>
                Organism <SortIcon k="organism" />
              </th>
              <th className="text-left py-3 px-4 text-xs font-medium text-foreground/60 uppercase tracking-wider cursor-pointer hover:text-foreground" onClick={() => handleSort("metrics.final_score")}>
                Score <SortIcon k="metrics.final_score" />
              </th>
              <th className="text-left py-3 px-4 text-xs font-medium text-foreground/60 uppercase tracking-wider">Version</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-foreground/60 uppercase tracking-wider">Date</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((seq: any, index: number) => (
              <tr
                key={index}
                onClick={() => navigate(`/sequence/${seq._id}`)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    navigate(`/sequence/${seq._id}`);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label={`View details for ${seq.name || "unnamed"}`}
                className="border-b border-foreground/5 hover:bg-foreground/5 transition cursor-pointer"
              >
                <td className="py-3 px-4">
                  <span className="px-2 py-0.5 border border-foreground/20 rounded text-xs font-mono text-foreground/70">
                    {seq.metrics?.length || seq.sequence?.length || "—"}
                  </span>
                </td>
                <td className="py-3 px-4 text-sm text-foreground max-w-xs truncate">{seq.name || "—"}</td>
                <td className="py-3 px-4 text-sm text-foreground/60 italic">{seq.organism || "N/A"}</td>
                <td className="py-3 px-4">
                  {seq.metrics?.final_score ? <ScoreBadge score={seq.metrics.final_score} /> : "—"}
                </td>
                <td className="py-3 px-4 text-sm text-foreground/60">v{seq.vers || "1.0"}</td>
                <td className="py-3 px-4 text-sm text-foreground/60">{seq.date || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Footer />
    </div>
  );
}
