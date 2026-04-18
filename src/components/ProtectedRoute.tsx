import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth, type UserRole } from "@/contexts/AuthContext";

const BARBER_PREFIX = "/barbeiro";
const CLIENT_PREFIX = "/cliente";

interface ProtectedRouteProps {
  children: ReactNode;
  /** Um único papel permitido (use `allowedRoles` para vários, ex.: /guia) */
  requiredRole?: UserRole;
  /** Papéis permitidos; se definido, substitui `requiredRole` */
  allowedRoles?: readonly UserRole[];
}

export const ProtectedRoute = ({ children, requiredRole, allowedRoles }: ProtectedRouteProps) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const path = location.pathname;

  if (isLoading) {
    return <div className="min-h-screen grid place-items-center text-sm text-muted-foreground">Carregando...</div>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: path }} replace />;
  }

  const isBarberRoute = path.startsWith(BARBER_PREFIX);
  const isClientRoute = path.startsWith(CLIENT_PREFIX);

  if (user.role === "barbeiro" && isClientRoute) {
    return <Navigate to="/barbeiro" replace />;
  }
  if (user.role === "cliente" && isBarberRoute) {
    return <Navigate to="/cliente" replace />;
  }

  const roleGate =
    allowedRoles && allowedRoles.length > 0
      ? allowedRoles
      : requiredRole != null
        ? [requiredRole]
        : null;

  if (roleGate && !roleGate.includes(user.role)) {
    return <Navigate to={user.role === "barbeiro" ? "/barbeiro" : "/cliente"} replace />;
  }

  return <>{children}</>;
};
