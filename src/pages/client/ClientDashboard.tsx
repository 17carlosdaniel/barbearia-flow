import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import ClientHomeIntro from "@/components/client-home/ClientHomeIntro";
import ErrorBoundary from "@/components/ErrorBoundary";
import ClientHeroBanner from "@/components/client-home/ClientHeroBanner";
import NextAppointmentCard, {
  type NextAppointmentData,
} from "@/components/client-home/NextAppointmentCard";
import ClientAct2QuickLayer from "@/components/client-home/ClientAct2QuickLayer";
import ClientDiscoverySection from "@/components/client-home/ClientDiscoverySection";
import ClientHomeSkeleton from "@/components/client-home/ClientHomeSkeleton";
import ClientHomeTabBar from "@/components/client-home/ClientHomeTabBar";
import { getClientHomeCopy } from "@/lib/clientHomeCopy";
import { cn } from "@/lib/utils";

const CLIENT_HOME_INTRO_SEEN_KEY = "barberflow_client_home_intro_seen";

const createNextAppointment = (): NextAppointmentData => {
  const startAt = new Date();
  startAt.setHours(startAt.getHours() + 2, 30, 0, 0);
  return {
    id: "3",
    barbershop: "Barbearia Premium",
    service: "Corte Premium",
    location: "Rua das Flores, 123",
    startAt,
  };
};

const getCountdown = (startAt: Date) => {
  const now = new Date();
  const sameDay = now.toDateString() === startAt.toDateString();
  const diffMs = startAt.getTime() - now.getTime();
  if (!sameDay || diffMs <= 0) return null;
  const totalMinutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}min`;
};

const ClientDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { identity } = useTheme();
  const isVintage = identity === "vintage";
  const homeCopy = getClientHomeCopy(identity);

  const CLIENT_HOME_INTRO_SEEN_KEY_USER = `${CLIENT_HOME_INTRO_SEEN_KEY}_${user?.id ?? "guest"}`;

  const [introVisible, setIntroVisible] = useState<boolean>(() => {
    try {
      return localStorage.getItem(`${CLIENT_HOME_INTRO_SEEN_KEY}_${user?.id ?? "guest"}`) !== "1";
    } catch {
      return true;
    }
  });
  const [loadingHome, setLoadingHome] = useState(true);
  const firstName = user?.name?.split(" ")[0] ?? "Cliente";
  const nextAppointment = useMemo(() => createNextAppointment(), []);
  const countdownText = getCountdown(nextAppointment.startAt);
  const isUrgent =
    countdownText !== null &&
    nextAppointment.startAt.getTime() - Date.now() <= 3 * 60 * 60 * 1000;

  useEffect(() => {
    const timer = setTimeout(() => setLoadingHome(false), 900);
    return () => clearTimeout(timer);
  }, []);

  const markIntroSeen = () => {
    try {
      localStorage.setItem(CLIENT_HOME_INTRO_SEEN_KEY_USER, "1");
    } catch {
      // noop
    }
    setIntroVisible(false);
  };

  const handleFinishIntro = (payload: { locationStatus: "granted" | "denied" | "unavailable" | "skipped" }) => {
    markIntroSeen();
    // pequeno delay para garantir que o estado foi salvo antes de navegar
    setTimeout(() => {
      navigate("/cliente/buscar", {
        state: {
          fromClientIntro: true,
          introGeoStatus: payload.locationStatus,
        },
      });
    }, 50);
  };

  return (
    <DashboardLayout userType="cliente">
      <AnimatePresence mode="wait">
        {introVisible ? (
          <ErrorBoundary key="intro-boundary" onDomMutationError={markIntroSeen}>
            <ClientHomeIntro
              key="client-home-intro"
              firstName={firstName}
              onSkip={markIntroSeen}
              onFinish={handleFinishIntro}
            />
          </ErrorBoundary>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className={cn(
              "theme-body mx-auto max-w-7xl pb-24 md:pb-12",
              isVintage ? "space-y-12 px-1 sm:px-0" : "space-y-6 px-1 sm:px-0",
            )}
          >
            {loadingHome ? (
              <ClientHomeSkeleton />
            ) : (
              <>
                <ClientHeroBanner firstName={firstName} />

                <div className={cn(isVintage ? "space-y-14" : "space-y-7")}>
                  {isVintage ? (
                    <>
                      {/* Ato 1 — apenas contexto imediato (sem disponibilidade aqui) */}
                      <section
                        aria-label={homeCopy.act1.aria}
                        className="vintage-panel relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-primary/[0.04] via-card to-card px-5 py-8 sm:px-8 sm:py-10"
                      >
                        <div
                          className="pointer-events-none absolute -right-24 top-0 h-48 w-48 rounded-full opacity-25"
                          style={{
                            background:
                              "radial-gradient(circle, hsl(var(--primary) / 0.12), transparent 68%)",
                          }}
                          aria-hidden
                        />
                        {homeCopy.act1.ribbon ? (
                          <div className="relative mb-8 flex flex-wrap items-center gap-3 border-b border-primary/10 pb-6">
                            <span
                              className="hidden h-px min-w-[2rem] flex-1 bg-gradient-to-r from-transparent via-primary/25 to-primary/35 sm:block sm:max-w-[4rem]"
                              aria-hidden
                            />
                            <p className="vintage-label">{homeCopy.act1.ribbon}</p>
                            <span
                              className="hidden h-px flex-1 bg-gradient-to-l from-transparent via-primary/25 to-primary/35 sm:block sm:max-w-[4rem]"
                              aria-hidden
                            />
                          </div>
                        ) : null}
                        <NextAppointmentCard
                          appointment={nextAppointment}
                          countdownText={countdownText ?? undefined}
                          isUrgent={isUrgent}
                        />
                      </section>

                      <ClientAct2QuickLayer />

                      <ClientDiscoverySection />
                    </>
                  ) : (
                    <>
                      {/* Ato 1 — hero já passou; aqui só próxima ação (disponibilidade no Ato 2) */}
                      <section aria-label={homeCopy.act1.aria} className="space-y-3">
                        <NextAppointmentCard
                          appointment={nextAppointment}
                          countdownText={countdownText ?? undefined}
                          isUrgent={isUrgent}
                        />
                      </section>

                      <ClientAct2QuickLayer />

                      <ClientDiscoverySection />
                    </>
                  )}
                </div>

                <ClientHomeTabBar />
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
};

export default ClientDashboard;
