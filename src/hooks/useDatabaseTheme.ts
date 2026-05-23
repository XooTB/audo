import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";

export type ThemeFromDb = "dark" | "light";

export function useDatabaseTheme() {
  const [theme, setTheme] = useState<ThemeFromDb | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTheme() {
      try {
        const result = await invoke<string>("get_frontend_mode");
        setTheme(result as ThemeFromDb);
      } catch (error) {
        console.error("Failed to fetch theme from database:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchTheme();
  }, []);

  return { theme, loading };
}