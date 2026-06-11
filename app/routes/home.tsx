import { useState, useEffect } from "react";
import { Link } from "react-router";
import { ClientOnly } from "../components/ClientOnly";
import { ThemeToggle } from "../components/ThemeToggle";
import PillNav from "../components/PillNav";
import Footer from "../components/Footer";

export function meta() {
  return [
    { title: "BEPS BDD — RNA Folding Database" },
    { name: "description", content: "RNA 3D structure folding trajectories database" },
  ];
}

export default function Home() {
  const [stats, setStats] = useState({
    total: 0,
    organisms: 0,
    avgScore: 0,
  });

  const navItems = [
    { label: "Home", href: "/" },
    { label: "Browse", href: "/browse" },
  ];

  useEffect(() => {
    fetch("http://localhost:8000/sequences/?limit=1000&skip=0")
      .then(res => res.json())
      .then((data: any) => {
        const total = data.length;
        const organisms = new Set(data.map((s: any) => s.organism).filter(Boolean)).size;
        const scores = data.map((s: any) => s.metrics?.final_score).filter(Boolean);
        const avgScore = scores.length > 0
          ? scores.reduce((a: number, b: number) => a + b, 0) / scores.length
          : 0;
        setStats({ total, organisms, avgScore });
      })
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="bg-background text-foreground min-h-screen">
      <ClientOnly>
        <PillNav
          logo="/favicon.ico"
          logoAlt="Logo"
          logoHref="https://www.ibisc.univ-evry.fr/en/"
          items={navItems}
          activeHref="/"
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

      <div className="max-w-4xl mx-auto px-8 pt-32 pb-16 text-center">
        <h1 className="text-5xl font-bold text-foreground mb-4">
          RNA Folding Database
        </h1>
        <p className="text-xl text-foreground/60 mb-8 max-w-2xl mx-auto">
          A database of RNA 3D structure folding trajectories, developed at IBISC.
        </p>
        <Link
          to="/browse"
          className="inline-block px-8 py-4 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition text-lg font-medium"
        >
          Browse sequences →
        </Link>
      </div>

      {/* Stats */}
      <div className="max-w-4xl mx-auto px-8 pb-16">
        <div className="grid grid-cols-3 gap-6">
          <div className="border border-foreground/10 rounded-lg p-8 text-center">
            <p className="text-5xl font-bold text-foreground mb-2">{stats.total}</p>
            <p className="text-sm text-foreground/50">RNA sequences</p>
          </div>
          <div className="border border-foreground/10 rounded-lg p-8 text-center">
            <p className="text-5xl font-bold text-foreground mb-2">{stats.organisms}</p>
            <p className="text-sm text-foreground/50">Organisms</p>
          </div>
          <div className="border border-foreground/10 rounded-lg p-8 text-center">
            <p className="text-5xl font-bold text-foreground mb-2">{stats.avgScore.toFixed(3)}</p>
            <p className="text-sm text-foreground/50">Average score</p>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-4xl mx-auto px-8 pb-16">
        <h2 className="text-2xl font-bold text-foreground mb-8 text-center">
          What makes BEPS unique
        </h2>
        <div className="grid grid-cols-3 gap-6">
          <div className="border border-foreground/10 rounded-lg p-6">
            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 6v6l4 2"/></svg>
            </div>
            <h3 className="text-sm font-bold text-foreground mb-2">Folding trajectories</h3>
            <p className="text-xs text-foreground/60">Full optimization paths from initial to final structure.</p>
          </div>
          <div className="border border-foreground/10 rounded-lg p-6">
            <div className="w-10 h-10 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
            </div>
            <h3 className="text-sm font-bold text-foreground mb-2">Quality metrics</h3>
            <p className="text-xs text-foreground/60">3 metrics and 4 scoring functions for each structure.</p>
          </div>
          <div className="border border-foreground/10 rounded-lg p-6">
            <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            </div>
            <h3 className="text-sm font-bold text-foreground mb-2">PDB download</h3>
            <p className="text-xs text-foreground/60">Download any structure in PDB format.</p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}