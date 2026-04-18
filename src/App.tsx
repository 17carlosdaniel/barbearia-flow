import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ScrollToTop from "@/components/ScrollToTop";

const routerFutureFlags = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
} as const;
import { AuthProvider } from "@/contexts/AuthContext";
import { LogoutFlowProvider } from "@/contexts/LogoutFlowContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { createQueryClient } from "@/lib/queryClient";
import Index from "./pages/Index";
import Planos from "./pages/Planos";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import Support from "./pages/Support";
import ProfileSecurity from "./pages/ProfileSecurity";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import NotFound from "./pages/NotFound";
const Guide = lazy(() => import("./pages/Guide"));
const AcceptInvite = lazy(() => import("./pages/AcceptInvite"));
const BarberDashboard = lazy(() => import("./pages/barber/BarberDashboard"));
const BarberServices = lazy(() => import("./pages/barber/BarberServices"));
const BarberHistory = lazy(() => import("./pages/barber/BarberHistory"));
const BarberClientProfile = lazy(() => import("./pages/barber/BarberClientProfile"));
const BarberCustomers = lazy(() => import("./pages/barber/BarberCustomers"));
const BarberSubscription = lazy(() => import("./pages/barber/BarberSubscription"));
const BarberProfile = lazy(() => import("./pages/barber/BarberProfile"));
const BarberReviews = lazy(() => import("./pages/barber/BarberReviews"));
const BarberMyShop = lazy(() => import("./pages/barber/BarberMyShop"));
const BarberStore = lazy(() => import("./pages/barber/BarberStore"));
const BarberShopOrders = lazy(() => import("./pages/barber/BarberShopOrders"));
const BarberShopDashboard = lazy(() => import("./pages/barber/BarberShopDashboard"));
const BarberFinance = lazy(() => import("./pages/barber/BarberFinance"));
const BarberFinanceAnalyses = lazy(() => import("./pages/barber/BarberFinanceAnalyses"));
const BarberFinancePix = lazy(() => import("./pages/barber/BarberFinancePix"));
const BarberEquipe = lazy(() => import("./pages/barber/BarberEquipe"));
const BarberNotifications = lazy(() => import("./pages/barber/BarberNotifications"));
const BarberShortcuts = lazy(() => import("./pages/barber/BarberShortcuts"));
const ClientDashboard = lazy(() => import("./pages/client/ClientDashboard"));
const ClientSearch = lazy(() => import("./pages/client/ClientSearch"));
const ClientAppointments = lazy(() => import("./pages/client/ClientAppointments"));
const ClientHistory = lazy(() => import("./pages/client/ClientHistory"));
const ClientProfile = lazy(() => import("./pages/client/ClientProfile"));
const ClientBarbershopDetail = lazy(() => import("./pages/client/ClientBarbershopDetail"));
const ClienteFidelidade = lazy(() => import("./pages/client/ClienteFidelidade"));
const ClientGiftCards = lazy(() => import("./pages/client/ClientGiftCards"));
const ClientStore = lazy(() => import("./pages/client/ClientStore"));
const ClientProductDetail = lazy(() => import("./pages/client/ClientProductDetail"));
const ClientNotifications = lazy(() => import("./pages/client/ClientNotifications"));
const ClientNewAppointment = lazy(() => import("./pages/client/ClientNewAppointment"));
const ClientPaymentCards = lazy(() => import("./pages/client/ClientPaymentCards"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const KpiDashboard = lazy(() => import("./pages/KpiDashboard"));

const queryClient = createQueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <ThemeProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter future={routerFutureFlags}>
          <ScrollToTop />
          <LogoutFlowProvider>
          <Suspense fallback={<div className="min-h-screen grid place-items-center text-sm text-muted-foreground">Carregando...</div>}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/planos" element={<Planos />} />
            <Route path="/login" element={<Login />} />
            <Route path="/cadastro" element={<Register />} />
            <Route path="/esqueci-senha" element={<ForgotPassword />} />
            <Route path="/privacidade" element={<Privacy />} />
            <Route path="/termos" element={<Terms />} />
            <Route path="/suporte" element={<Support />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/kpis" element={<KpiDashboard />} />
            <Route
              path="/guia"
              element={
                <ProtectedRoute allowedRoles={["cliente", "barbeiro"]}>
                  <Guide />
                </ProtectedRoute>
              }
            />
            <Route path="/aceitar-convite/:token" element={<AcceptInvite />} />
            <Route
              path="/barbeiro"
              element={
                <ProtectedRoute requiredRole="barbeiro">
                  <BarberDashboard />
                </ProtectedRoute>
              }
            />
            <Route path="/barbeiro/vagas" element={<Navigate to="/barbeiro" replace />} />
            <Route
              path="/barbeiro/servicos"
              element={
                <ProtectedRoute requiredRole="barbeiro">
                  <BarberServices />
                </ProtectedRoute>
              }
            />
            <Route
              path="/barbeiro/operacao"
              element={
                <ProtectedRoute requiredRole="barbeiro">
                  <Navigate to="/barbeiro/loja/dashboard" replace />
                </ProtectedRoute>
              }
            />
            <Route
              path="/barbeiro/financeiro"
              element={
                <ProtectedRoute requiredRole="barbeiro">
                  <BarberFinance />
                </ProtectedRoute>
              }
            />
            <Route
              path="/barbeiro/financeiro/analises"
              element={
                <ProtectedRoute requiredRole="barbeiro">
                  <BarberFinanceAnalyses />
                </ProtectedRoute>
              }
            />
            <Route
              path="/barbeiro/financeiro/pix"
              element={
                <ProtectedRoute requiredRole="barbeiro">
                  <BarberFinancePix />
                </ProtectedRoute>
              }
            />
            <Route
              path="/barbeiro/historico"
              element={
                <ProtectedRoute requiredRole="barbeiro">
                  <BarberHistory />
                </ProtectedRoute>
              }
            />
            <Route
              path="/barbeiro/clientes"
              element={
                <ProtectedRoute requiredRole="barbeiro">
                  <BarberCustomers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/barbeiro/clientes/:clientKey"
              element={
                <ProtectedRoute requiredRole="barbeiro">
                  <BarberClientProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/barbeiro/assinatura"
              element={
                <ProtectedRoute requiredRole="barbeiro">
                  <BarberSubscription />
                </ProtectedRoute>
              }
            />
            <Route
              path="/barbeiro/perfil"
              element={
                <ProtectedRoute requiredRole="barbeiro">
                  <BarberProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/barbeiro/seguranca"
              element={
                <ProtectedRoute requiredRole="barbeiro">
                  <ProfileSecurity userType="barbeiro" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/barbeiro/equipe"
              element={
                <ProtectedRoute requiredRole="barbeiro">
                  <BarberEquipe />
                </ProtectedRoute>
              }
            />
            <Route
              path="/barbeiro/minha-barbearia"
              element={
                <ProtectedRoute requiredRole="barbeiro">
                  <BarberMyShop />
                </ProtectedRoute>
              }
            />
            <Route
              path="/barbeiro/loja"
              element={
                <ProtectedRoute requiredRole="barbeiro">
                  <BarberStore />
                </ProtectedRoute>
              }
            />
            <Route
              path="/barbeiro/loja/pedidos"
              element={
                <ProtectedRoute requiredRole="barbeiro">
                  <BarberShopOrders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/barbeiro/loja/dashboard"
              element={
                <ProtectedRoute requiredRole="barbeiro">
                  <BarberShopDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/barbeiro/avaliacoes"
              element={
                <ProtectedRoute requiredRole="barbeiro">
                  <BarberReviews />
                </ProtectedRoute>
              }
            />
            <Route
              path="/barbeiro/notificacoes"
              element={
                <ProtectedRoute requiredRole="barbeiro">
                  <BarberNotifications />
                </ProtectedRoute>
              }
            />
            <Route
              path="/barbeiro/atalhos"
              element={
                <ProtectedRoute requiredRole="barbeiro">
                  <BarberShortcuts />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cliente"
              element={
                <ProtectedRoute requiredRole="cliente">
                  <ClientDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cliente/buscar"
              element={
                <ProtectedRoute requiredRole="cliente">
                  <ClientSearch />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cliente/barbearia/:id"
              element={
                <ProtectedRoute requiredRole="cliente">
                  <ClientBarbershopDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cliente/agendamentos"
              element={
                <ProtectedRoute requiredRole="cliente">
                  <ClientAppointments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cliente/novo-agendamento"
              element={
                <ProtectedRoute requiredRole="cliente">
                  <ClientNewAppointment />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cliente/historico"
              element={
                <ProtectedRoute requiredRole="cliente">
                  <ClientHistory />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cliente/perfil"
              element={
                <ProtectedRoute requiredRole="cliente">
                  <ClientProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cliente/seguranca"
              element={
                <ProtectedRoute requiredRole="cliente">
                  <ProfileSecurity userType="cliente" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cliente/fidelidade"
              element={
                <ProtectedRoute requiredRole="cliente">
                  <ClienteFidelidade />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cliente/loja"
              element={
                <ProtectedRoute requiredRole="cliente">
                  <ClientStore />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cliente/loja/produto/:id"
              element={
                <ProtectedRoute requiredRole="cliente">
                  <ClientProductDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cliente/gift-cards"
              element={
                <ProtectedRoute requiredRole="cliente">
                  <ClientGiftCards />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cliente/cartoes"
              element={
                <ProtectedRoute requiredRole="cliente">
                  <ClientPaymentCards />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cliente/notificacoes"
              element={
                <ProtectedRoute requiredRole="cliente">
                  <ClientNotifications />
                </ProtectedRoute>
              }
            />
            <Route path="/barbeiro/*" element={<Navigate to="/barbeiro" replace />} />
            <Route path="/cliente/*" element={<Navigate to="/cliente" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
          </LogoutFlowProvider>
          </BrowserRouter>
        </ThemeProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
