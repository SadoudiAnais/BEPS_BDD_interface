export default function Footer() {

    const scrollToTop = () => {
       window.scrollTo({ top: 0, behavior: "smooth" });
    };
  
    return (
    <footer className="bg-background border-t border-foreground/10 py-10 px-8">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">

        
        <div className="text-center md:text-left">
          <h3 className="text-sm font-medium text-foreground mb-1">ErFold-RNAWann Bdd</h3>
          <p className="text-xs text-foreground/50">
            Developed at IBISC
          </p>
        </div>

        <div className="flex gap-8">
          <div>
            <p className="text-xs font-medium text-foreground mb-2">BDD</p>
            <ul className="space-y-1">
              <li><a href="/modules" className="text-xs text-foreground/50 hover:text-foreground transition">Browse</a></li>
              <li><a href="/doc" className="text-xs text-foreground/50 hover:text-foreground transition">Sequence</a></li>
              <li><a href="/about" className="text-xs text-foreground/50 hover:text-foreground transition">About</a></li>
            </ul>
          </div>
          
        </div>

      </div>

      <div className="max-w-5xl mx-auto mt-8 pt-6 border-t border-foreground/10 flex justify-between items-center">
        <p className="text-xs text-foreground/40">
          © 2026 ErFold-RNAWann Base de données— IBISC       
           </p>
        <button onClick={scrollToTop} className="text-xs text-foreground/40 hover:text-foreground transition flex items-center gap-1">
          Back to top ↑
        </button>
      </div>
     </footer>
  );
}