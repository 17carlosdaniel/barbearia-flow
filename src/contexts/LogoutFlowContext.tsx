import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import LogoutAnimation from "@/components/LogoutAnimation";
import FarewellAnimation from "@/components/FarewellAnimation";
import { toast } from "@/hooks/use-toast";

export type LogoutFlowMode = "idle" | "logout" | "account_deleted";

interface LogoutFlowContextValue {
  mode: LogoutFlowMode;
  beginLogout: () => void;
  /** Inicia animação de despedida; ao terminar remove conta (mock), limpa sessão e redireciona */
  beginAccountDeletion: (onAfter?: () => void) => void;
}

const LogoutFlowContext = createContext<LogoutFlowContextValue | null>(null);

export function LogoutFlowProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<LogoutFlowMode>("idle");
  const navigate = useNavigate();
  const { logout, deleteAccount } = useAuth();
  const accountDeletionAfterRef = useRef<(() => void) | undefined>(undefined);

  const handleLogoutAnimationComplete = useCallback(() => {
    setMode("idle");
    logout();
    navigate("/login", { replace: true });
  }, [logout, navigate]);

  const handleFarewellComplete = useCallback(() => {
    const after = accountDeletionAfterRef.current;
    accountDeletionAfterRef.current = undefined;
    setMode("idle");
    deleteAccount();
    try {
      after?.();
    } catch {
      // noop
    }
    toast({
      title: "Conta encerrada",
      description: "Sua conta foi removida. Sentiremos sua falta.",
    });
    navigate("/login", { replace: true });
  }, [deleteAccount, navigate]);

  const beginLogout = useCallback(() => {
    setMode("logout");
  }, []);

  const beginAccountDeletion = useCallback((onAfter?: () => void) => {
    accountDeletionAfterRef.current = onAfter;
    setMode("account_deleted");
  }, []);

  return (
    <LogoutFlowContext.Provider value={{ mode, beginLogout, beginAccountDeletion }}>
      {children}
      {mode === "logout" ? <LogoutAnimation onComplete={handleLogoutAnimationComplete} /> : null}
      {mode === "account_deleted" ? <FarewellAnimation onComplete={handleFarewellComplete} /> : null}
    </LogoutFlowContext.Provider>
  );
}

export function useLogoutFlow() {
  const ctx = useContext(LogoutFlowContext);
  if (!ctx) throw new Error("useLogoutFlow deve ser usado dentro de LogoutFlowProvider");
  return ctx;
}
