"use client";
import { useEffect, useState } from "react";

export default function ThemeSwitcher() {
  const [mounted, setMounted] = useState(false);
  const [currentTheme, setCurrentTheme] = useState("");

  useEffect(() => {
    setMounted(true);
    // 1. Check localStorage
    // 2. If empty, check the actual attribute on <html> (set by your layout script)
    // 3. Fallback to "night" (to match your new default)
    const activeTheme = 
      localStorage.getItem("app-theme") || 
      document.documentElement.getAttribute("data-theme") || 
      "night";
    
    setCurrentTheme(activeTheme);
  }, []);

  if (!mounted) return <div className="w-10 h-10" />; 

  const toggleTheme = () => {
    // Standardizing the toggle logic
    const nextTheme = currentTheme === "night" ? "wireframe" : "night";
    
    setCurrentTheme(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
    localStorage.setItem("app-theme", nextTheme);
  };

  return (
    <button onClick={toggleTheme} className="btn btn-ghost btn-circle" aria-label="Toggle Theme">
      {currentTheme === "night" ? (
        /* SUN Icon */
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707m12.728 12.728L5.121 5.121M12 8a4 4 0 100 8 4 4 0 000-8z" />
        </svg>
      ) : (
        /* MOON Icon */
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )}
    </button>
  );
}