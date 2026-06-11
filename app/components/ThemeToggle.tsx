import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  return (
    <button
      onClick={toggleTheme}
      className="relative w-12 h-12 rounded-none border-[3px] flex items-center justify-center cursor-pointer transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] overflow-hidden select-none outline-none focus:ring-2 focus:ring-[#a9927d] bg-[#0a3d67] border-[#a9927d] hover:bg-[#124f7c] shadow-[0_0_15px_rgba(10,61,103,0.6)]"
      aria-label="Toggle theme"
    >
      {/* Decorative background dashed square */}
      <div
        className={`
          absolute inset-2 border border-dashed opacity-30 transition-all duration-500 pointer-events-none border-[#a9927d]
          ${isDark ? "rotate-45 scale-110" : "-rotate-45 scale-90"}
        `}
      />

      {/* Technical corner marks */}
      <span className="absolute top-1 left-1 w-1 h-1 bg-[#a9927d]" />
      <span className="absolute top-1 right-1 w-1 h-1 bg-[#a9927d]" />
      <span className="absolute bottom-1 left-1 w-1 h-1 bg-[#a9927d]" />
      <span className="absolute bottom-1 right-1 w-1 h-1 bg-[#a9927d]" />

      {/* Rotating Sun/Moon wrapper */}
      <div
        className={`
          relative w-6 h-6 flex items-center justify-center transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]
          ${isDark ? "rotate-180" : "rotate-0"}
        `}
      >
        {/* Sun Icon */}
        <Sun
          className={`
            h-6 w-6 transition-all duration-500 absolute text-[#a9927d]
            ${
              isDark
                ? "opacity-0 scale-50 rotate-90"
                : "opacity-100 scale-100 rotate-0"
            }
          `}
        />
        {/* Moon Icon */}
        <Moon
          className={`
            h-6 w-6 transition-all duration-500 absolute text-[#a9927d]
            ${
              isDark
                ? "opacity-100 scale-100 rotate-0"
                : "opacity-0 scale-50 -rotate-90"
            }
          `}
        />
      </div>
      <span className="sr-only">Toggle theme</span>
    </button>
  );
}
