"use client";

import { useEffect, useState } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function ToastProvider() {
  // Store the actual theme name from your HTML tag
  const [currentTheme, setCurrentTheme] = useState<string>("night");

  useEffect(() => {
    const updateTheme = () => {
      const theme = document.documentElement.getAttribute("data-theme") || "night";
      setCurrentTheme(theme);
    };

    updateTheme();

    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => observer.disconnect();
  }, []);

  // 🔑 Mapping logic: Convert your DaisyUI theme to Toastify's supported themes
  // If it's 'night', use 'dark'. Otherwise (wireframe, light, etc.), use 'light'.
  const toastifyTheme = currentTheme === "night" ? "dark" : "light";

  return (
    <ToastContainer 
      theme={toastifyTheme} className={'z-40'}
      position="top-right"  autoClose={2500} 
      hideProgressBar={true}
    />
  );
}