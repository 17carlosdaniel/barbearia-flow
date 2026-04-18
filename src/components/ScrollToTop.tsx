import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Ao mudar de rota, volta ao topo (evita “pular” sem contexto ao trocar de página).
 * Usa scroll instantâneo; a suavidade fica nas âncoras da landing (CSS scroll-behavior).
 */
const ScrollToTop = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) return;
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname, hash]);

  return null;
};

export default ScrollToTop;
