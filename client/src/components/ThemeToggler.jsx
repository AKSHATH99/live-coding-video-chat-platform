'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react'; // Optional: install `lucide-react` or use your own icons

export default function DarkModeToggle() {
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setMounted(true);
    const userTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (userTheme === 'dark' || (!userTheme && systemPrefersDark)) {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    } else {
      document.documentElement.classList.remove('dark');
      setIsDark(false);
    }
  }, []);

  const toggleDarkMode = () => {
    const enabled = document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', enabled ? 'dark' : 'light');
    setIsDark(enabled);
  };

  if (!mounted) return null; // Avoid hydration mismatch on server

  return (
    <button
      onClick={toggleDarkMode}
      className="p-2 rounded-full border border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
      aria-label="Toggle dark mode"
    >
      {isDark ? (
        <Sun className="w-5 h-5 text-yellow-400" />
      ) : (
        <Moon className="w-5 h-5 text-gray-800" />
      )}
    </button>
  );
}
