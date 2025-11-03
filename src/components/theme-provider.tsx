import { createContext, useContext, useEffect, useState, useMemo, type ReactNode } from "react";

type Theme = "dark" | "light" | "system";

type ThemeProviderProps = {
  children: ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "wyshkit-ui-theme",
  ...props
}: ThemeProviderProps) {
  // Use lazy initialization to avoid SSR issues
  const [theme, setTheme] = useState<Theme>(defaultTheme);
  
  // Initialize from localStorage in useEffect to avoid SSR issues
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored && ['dark', 'light', 'system'].includes(stored)) {
          setTheme(stored as Theme);
        }
      } catch (error) {
        // Handle localStorage errors silently
        console.error('Failed to read theme from localStorage:', error);
      }
    }
  }, [storageKey]);

  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove("light", "dark");

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";

      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(theme);
  }, [theme]);

  const value = useMemo(() => ({
    theme,
    setTheme: (newTheme: Theme) => {
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem(storageKey, newTheme);
        }
        setTheme(newTheme);
      } catch (error) {
        console.error('Failed to save theme to localStorage:', error);
        setTheme(newTheme);
      }
    },
  }), [theme, storageKey]);

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");

  return context;
};

