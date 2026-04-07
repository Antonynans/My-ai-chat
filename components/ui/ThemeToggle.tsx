"use client";
import { useEffect } from "react";
import { useChatStore } from "@/lib/store";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useChatStore();

  useEffect(() => {
    // Load theme from localStorage on mount
    const savedTheme = localStorage.getItem("theme") as "dark" | "light" | null;
    if (savedTheme && savedTheme !== theme) {
      setTheme(savedTheme);
    }
  }, []); // Only run on mount

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  return (
    <button
      onClick={toggleTheme}
      className="w-6.5 h-6.5 rounded-[7px] border-none bg-transparent text-(--text3) flex items-center justify-center cursor-pointer transition-all duration-[120ms] shrink-0 hover:bg-[var(--surface)] hover:text-[var(--text)]"
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
    </button>
  );
}
