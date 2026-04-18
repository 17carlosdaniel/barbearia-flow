import { useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";

/**
 * Alterna automaticamente entre claro/escuro conforme o horário.
 * - Modo escuro: das 18h às 6h
 * - Modo claro: das 6h às 18h
 *
 * Usa o ThemeContext para manter tudo consistente com os toggles existentes.
 */
const AutoDarkMode = () => {
  const { setTheme, autoDark } = useTheme();

  useEffect(() => {
    if (!autoDark) return;

    const applyTheme = () => {
      const hour = new Date().getHours();
      if (hour >= 18 || hour < 6) {
        setTheme("dark");
      } else {
        setTheme("light");
      }
    };

    applyTheme();
    const interval = window.setInterval(applyTheme, 60000);
    return () => window.clearInterval(interval);
  }, [setTheme, autoDark]);

  return null;
};

export default AutoDarkMode;

