import { createContext, useContext, useEffect, useState } from "react"
import { invoke } from "@tauri-apps/api/core"
import { useDatabaseTheme } from "@/hooks/useDatabaseTheme"

type Theme = "dark" | "light" | "system"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>("system")
  const [dbTheme, setDbTheme] = useState<Theme | null>(null)
  const { theme: dbFetchedTheme, loading } = useDatabaseTheme()

  // Initialize theme from database on mount
  useEffect(() => {
    if (dbFetchedTheme !== null && !loading) {
      setDbTheme(dbFetchedTheme)
      // Set initial theme to database value if available, otherwise use defaultTheme or localStorage
      const initialTheme =
        (dbFetchedTheme as Theme) ||
        (localStorage.getItem(storageKey) as Theme) ||
        defaultTheme
      setTheme(initialTheme)
    }
  }, [dbFetchedTheme, loading, storageKey, defaultTheme])

  // Update theme when database theme changes (after initial load)
  useEffect(() => {
    if (!loading && dbFetchedTheme !== null && dbTheme !== dbFetchedTheme) {
      setDbTheme(dbFetchedTheme)
      // Only update if not overridden by localStorage or manual change
      const currentLocal = localStorage.getItem(storageKey) as Theme
      if (!currentLocal) {
        setTheme(dbFetchedTheme as Theme)
      }
    }
  }, [dbFetchedTheme, loading, dbTheme, storageKey])

  useEffect(() => {
    const root = window.document.documentElement

    root.classList.remove("light", "dark")

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light"

      root.classList.add(systemTheme)
      return
    }

    root.classList.add(theme)
  }, [theme])

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme)
      setTheme(theme)
      // Also save to database
      invoke("save_frontend_mode", { mode: theme })
    },
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")

  return context
}