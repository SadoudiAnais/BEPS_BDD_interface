import { useState, useEffect } from "react";
import { Link } from "react-router";
import { ClientOnly } from "../components/ClientOnly";
import { ThemeToggle } from "../components/ThemeToggle";
import PillNav from "../components/PillNav";
import Footer from "../components/Footer";

export function meta() {
  return [
    { title: "ErFold-RNAWann — RNA Folding Trajectories Database" },
    { name: "description", content: "The first RNA 3D folding trajectories database" },
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
    { label: "About", href: "/About" },
  ];

  useEffect(() => {
    fetch("https://api.paulverot.fr/sequences/?limit=1000&skip=0")
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
          logoAlt="ErFold-RNAWann"
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

      {/* Hero */}
      <div className="max-w-5xl mx-auto px-8 pt-36 pb-20 text-center">
        <div className="inline-block px-4 py-1.5 border border-foreground/20 rounded-full text-xs text-foreground/50 mb-8">
          Developed at IBISC
        </div>
        <h1 className="text-6xl font-bold text-foreground mb-6 leading-tight">
          ErFold-RNAWann
        </h1>
        <p className="text-xl text-foreground/50 mb-4 max-w-2xl mx-auto leading-relaxed">
          The database of RNA 3D structure folding trajectories.
        </p>
        <p className="text-base text-foreground/40 mb-12 max-w-xl mx-auto">
          Explore complete optimization paths, quality metrics and PDB structures
          for hundreds of RNA sequences.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            to="/browse"
            className="px-8 py-4 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition text-base font-medium"
          >
            Browse database →
          </Link>
         
        </div>
      </div>

      {/* Stats */}
      <div className="border-t border-b border-foreground/10 py-16 mb-20">
        <div className="max-w-4xl mx-auto px-8">
          <div className="grid grid-cols-3 gap-8 text-center">
            <div>
              <p className="text-5xl font-bold text-foreground mb-2">{stats.total}</p>
              <p className="text-sm text-foreground/40 uppercase tracking-wider">RNA sequences</p>
            </div>
            <div>
              <p className="text-5xl font-bold text-foreground mb-2">{stats.organisms}</p>
              <p className="text-sm text-foreground/40 uppercase tracking-wider">Organisms</p>
            </div>
            <div>
              <p className="text-5xl font-bold text-foreground mb-2">{stats.avgScore.toFixed(3)}</p>
              <p className="text-sm text-foreground/40 uppercase tracking-wider">Average score</p>
            </div>
          </div>
        </div>
      </div>

     

      {/* Features */}
      <div className="max-w-5xl mx-auto px-8 pb-24">
        <p className="text-xs text-foreground/40 uppercase tracking-wider text-center mb-4"></p>
        <h2 className="text-3xl font-bold text-foreground mb-16 text-center">
            Why ErFold-RNAWann?
        </h2>
        <div className="grid grid-cols-3 gap-8">

          <div className="border border-foreground/10 rounded-xl p-8 hover:border-foreground/30 transition">
            <div className="w-12 h-12 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 6v6l4 2"/></svg>
            </div>
            <h3 className="text-base font-bold text-foreground mb-3">Folding trajectories</h3>
            <p className="text-sm text-foreground/50 leading-relaxed">
              Folding paths from initial to final structure — not just the end result, but every step of the folding process.
            </p>
          </div>

          <div className="border border-foreground/10 rounded-xl p-8 hover:border-foreground/30 transition">
            <div className="w-12 h-12 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
            </div>
            <h3 className="text-base font-bold text-foreground mb-3">Quality metrics</h3>
            <p className="text-sm text-foreground/50 leading-relaxed">
              3 state-of-the-art metrics and 4 scoring functions to objectively evaluate every predicted structure.
            </p>
          </div>

          <div className="border border-foreground/10 rounded-xl p-8 hover:border-foreground/30 transition">
            <div className="w-12 h-12 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            </div>
            <h3 className="text-base font-bold text-foreground mb-3">PDB download</h3>
            <p className="text-sm text-foreground/50 leading-relaxed">
              Download any structure in PDB format —  compatible with all major bioinformatics software.
            </p>
          </div>

        </div>
      </div>

      {/* CTA */}
      <div className="border-t border-foreground/10 py-20">
        <div className="max-w-2xl mx-auto px-8 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Ready to explore ?
          </h2>
          <p className="text-foreground/50 mb-8">
            Browse hundreds of RNA folding trajectories and download PDB structures.
          </p>
          <Link
            to="/browse"
            className="inline-block px-8 py-4 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition text-base font-medium"
          >
            Get started →
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
}