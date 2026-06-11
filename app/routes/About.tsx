import { Link } from "react-router";
import { ClientOnly } from "../components/ClientOnly";
import { ThemeToggle } from "../components/ThemeToggle";
import PillNav from "../components/PillNav";
import Footer from "../components/Footer";

export function meta() {
  return [
    { title: "About - ErFold-RNAWann" },
    { name: "description", content: "About ErFold-RNAWann" },
  ];
}

export default function About() {
  const navItems = [
    { label: "Home", href: "/" },
    { label: "Browse", href: "/browse" },
    { label: "About", href: "/about" },
  ];

  const team = [
    {
      initials: "GP",
      name: "Guillaume Postic",
      color: "bg-blue-100 text-blue-700",
    },
    {
      initials: "EG",
      name: "Erwann Gallois",
      color: "bg-teal-100 text-teal-700",
    },
    {
      initials: "AS",
      name: "Anaïs Sadoudi",
      color: "bg-purple-100 text-purple-700",
    },
    {
      initials: "PV",
      name: "Paul Verot",
      color: "bg-amber-100 text-amber-700",
    },
    {
      initials: "AFL",
      name: "Aurore Francheteau Lacroix",
      color: "bg-pink-100 text-pink-700",
    },
  ];

  return (
    <div className="bg-background text-foreground min-h-screen">
      <ClientOnly>
        <PillNav
          logo="/favicon.ico"
          logoAlt="ErFold-RNAWann"
          logoHref="https://www.ibisc.univ-evry.fr/en/"
          items={navItems}
          activeHref="/about"
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

      <div className="max-w-4xl mx-auto px-8 pt-32 pb-20">

        {/* About */}
        <div className="text-center mb-20">
          <p className="text-xs text-foreground/40 uppercase tracking-wider mb-4">About</p>
          <h1 className="text-5xl font-bold text-foreground mb-6">ErFold-RNAWann</h1>
          <p className="text-lg text-foreground/50 max-w-2xl mx-auto leading-relaxed">
            ErFold-RNAWann is a database of RNA 3D structure folding trajectories, developed at IBISC.
          </p>
        </div>

        <div className="border border-foreground/10 rounded-xl p-10 mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">What is ErFold-RNAWann?</h2>
          <p className="text-foreground/50 leading-relaxed mb-4">
            RNA molecules play a crucial role in many biological processes. Understanding how they fold into their 3D structure is key to developing new drugs and understanding diseases.
          </p>
          <p className="text-foreground/50 leading-relaxed">
            ErFold-RNAWann provides researchers with a unique dataset of complete folding trajectories — not just the final structure, but every step of the optimization process. This allows for deeper analysis of RNA folding dynamics.
          </p>
        </div>

        {/* Team */}
        <h2 className="text-2xl font-bold text-foreground mb-8 text-center">Team</h2>
        <div className="grid grid-cols-5 gap-6 mb-20">
          {team.map((member, i) => (
            <div key={i} className="text-center">
              <div className={`w-16 h-16 rounded-full ${member.color} flex items-center justify-center mx-auto mb-3 text-sm font-bold`}>
                {member.initials}
              </div>
              <h3 className="text-sm font-medium text-foreground">{member.name}</h3>
            </div>
          ))}
        </div>

        {/* Contact */}
        <div className="border border-foreground/10 rounded-xl p-10 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">Contact us</h2>
          <p className="text-foreground/50 mb-6">
            Interested in ErFold-RNAWann ?
          </p>
          <a
            href="mailto:guillaume.postic@univ-evry.fr"
            className="inline-block px-8 py-4 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition text-base font-medium"
          >
            Send us an email →
          </a>
          <p className="text-xs text-foreground/30 mt-6">
            IBISC — Évry, France
          </p>
        </div>

      </div>

      <Footer />
    </div>
  );
}