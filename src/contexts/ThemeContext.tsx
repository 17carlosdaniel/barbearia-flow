import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";

const STORAGE_KEY = "barbeflow_theme";
const IDENTITY_KEY = "barbeflow_identity";

/** Duração alinhada ao CSS em `index.css` (identity-animating). */
const IDENTITY_TRANSITION_MS = 260;

export type Theme = "light" | "dark";

/** Vintage/Retro: marrom, preto, dourado, serifadas. Moderno/Industrial: cinza, branco, preto, sem serifa. */
export type Identity = "vintage" | "modern";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  identity: Identity;
  setIdentity: (identity: Identity) => void;
  autoDark: boolean;
  setAutoDark: (enabled: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

function loadStoredTheme(): Theme {
  return "dark";
}

function loadStoredIdentity(): Identity {
  try {
    const stored = localStorage.getItem(IDENTITY_KEY);
    if (stored === "vintage" || stored === "modern") return stored;
  } catch {
    // ignore
  }
  return "vintage";
}

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>(loadStoredTheme);
  const [identity, setIdentityState] = useState<Identity>(loadStoredIdentity);
  const identityAnimTimer = useRef<ReturnType<typeof window.setTimeout> | null>(null);
  const autoDark = false;

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("identity-vintage", "identity-modern");
    root.classList.add(`identity-${identity}`);
    root.setAttribute("data-identity", identity);
    localStorage.setItem(IDENTITY_KEY, identity);
  }, [identity]);

  const setTheme = (_value: Theme) => setThemeState("dark");
  const toggleTheme = () => setThemeState("dark");
  const setIdentity = (value: Identity) => {
    if (value === identity) return;
    const root = document.documentElement;
    const reduceMotion =
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (identityAnimTimer.current) {
      window.clearTimeout(identityAnimTimer.current);
      identityAnimTimer.current = null;
    }

    if (reduceMotion) {
      setIdentityState(value);
      root.classList.remove("identity-animating");
      return;
    }

    root.classList.add("identity-animating");
    setIdentityState(value);
    identityAnimTimer.current = window.setTimeout(() => {
      root.classList.remove("identity-animating");
      identityAnimTimer.current = null;
    }, IDENTITY_TRANSITION_MS);
  };
  const setAutoDark = (_enabled: boolean) => undefined;

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, identity, setIdentity, autoDark, setAutoDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
};
