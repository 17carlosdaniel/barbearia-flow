import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import {
  MapPin,
  Scissors,
  Calendar,
  Clock,
  CreditCard,
  Store,
  ArrowLeft,
  ArrowRight,
  Check,
  QrCode,
  Copy,
  Sparkles,
  ShoppingBag,
  Search,
  Droplets,
  Package,
  type LucideIcon,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { addAppointment } from "@/lib/appointments";
import { getBarbershopProfile } from "@/lib/barbershopProfile";
import { getBarberCatalog } from "@/lib/barberCatalog";
import { getStoreProductsByBarbershop, registerProductSale } from "@/lib/storeV2";

const barbershops = [
  { id: 1, name: "Studio Gold", address: "Rua Augusta, 1200 - São Paulo, SP", rating: 4.8, reviews: 124 },
  { id: 2, name: "Barber Kings", address: "Av. Paulista, 800 - São Paulo, SP", rating: 4.6, reviews: 89 },
  { id: 3, name: "Barbearia Premium", address: "Rua Oscar Freire, 350 - São Paulo, SP", rating: 4.9, reviews: 201 },
];

const servicesMap: Record<number, { id: string; name: string; price: number; duration: string }[]> = {
  1: [
    { id: "fallback-1", name: "Corte Social", price: 45, duration: "30 min" },
    { id: "fallback-2", name: "Corte Degradê", price: 55, duration: "40 min" },
    { id: "fallback-3", name: "Corte + Barba", price: 75, duration: "50 min" },
    { id: "fallback-4", name: "Barba", price: 35, duration: "20 min" },
  ],
  2: [
    { id: "fallback-5", name: "Corte Degradê", price: 50, duration: "35 min" },
    { id: "fallback-6", name: "Corte Navalhado", price: 60, duration: "45 min" },
    { id: "fallback-7", name: "Barba Completa", price: 40, duration: "25 min" },
  ],
  3: [
    { id: "fallback-8", name: "Corte Premium", price: 80, duration: "45 min" },
    { id: "fallback-9", name: "Corte + Barba + Hidratação", price: 120, duration: "1h 10 min" },
    { id: "fallback-10", name: "Barba Premium", price: 50, duration: "30 min" },
  ],
};

type UpsellOption = { name: string; price: number; discount?: number; icon: LucideIcon };

const upsellMap: Record<string, UpsellOption[]> = {
  Corte: [
    { name: "Lavagem Especial + Massagem Capilar", price: 15, icon: Sparkles },
    { name: "Hidratação Capilar", price: 20, icon: Droplets },
  ],
  Barba: [
    { name: "Toalha Quente + Óleo Essencial", price: 10, icon: Sparkles },
    { name: "Pomada Modeladora (retirar no dia)", price: 35, discount: 20, icon: Package },
  ],
  default: [
    { name: "Sobrancelha na Navalha", price: 15, icon: Scissors },
    { name: "Kit Pós-Corte (Pomada + Shampoo)", price: 55, discount: 15, icon: Package },
  ],
};

const getUpsells = (serviceName: string) => {
  const key = Object.keys(upsellMap).find((k) => serviceName.toLowerCase().includes(k.toLowerCase()));
  return upsellMap[key || "default"];
};

const generateTimeSlots = () => {
  const slots: string[] = [];
  for (let h = 9; h <= 19; h++) {
    slots.push(`${String(h).padStart(2, "0")}:00`);
    if (h < 19) slots.push(`${String(h).padStart(2, "0")}:30`);
  }
  return slots;
};

const getNextDays = (count: number) => {
  const days: { label: string; value: string; weekday: string }[] = [];
  const weekdays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  for (let i = 0; i < count; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    days.push({
      label: `${d.getDate()}/${d.getMonth() + 1}`,
      value: d.toISOString().split("T")[0],
      weekday: weekdays[d.getDay()],
    });
  }
  return days;
};

const steps = [
  { id: 1, label: "Barbearia", icon: MapPin },
  { id: 2, label: "Serviço", icon: Scissors },
  { id: 3, label: "Extras", icon: ShoppingBag },
  { id: 4, label: "Data & Hora", icon: Calendar },
  { id: 5, label: "Pagamento", icon: CreditCard },
];

const pixCode =
  "00020126580014BR.GOV.BCB.PIX0136a1b2c3d4-e5f6-7890-abcd-ef1234567890520400005303986540575.005802BR5913STUDIO GOLD6009SAO PAULO62070503***6304ABCD";

const parseDurationToMinutes = (duration: string): number => {
  const hourMatch = duration.match(/(\d+)h/i);
  const minMatch = duration.match(/(\d+)\s*min/i);
  const hours = hourMatch ? Number(hourMatch[1]) : 0;
  const minutes = minMatch ? Number(minMatch[1]) : 0;
  return hours * 60 + minutes || 45;
};

const ClientNewAppointment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [selectedShop, setSelectedShop] = useState<number | null>(null);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "processing" | "confirmed">("pending");
  const [shopQuery, setShopQuery] = useState("");

  const shop = barbershops.find((b) => b.id === selectedShop);
  const shopCatalog = selectedShop ? getBarberCatalog(selectedShop) : null;
  const services = selectedShop
    ? (() => {
        if (shopCatalog && shopCatalog.services.length > 0) {
          const fromServices = shopCatalog.services.map((item) => ({
            id: item.id,
            name: item.name,
            price: item.price,
            duration: `${item.durationMinutes} min`,
            isPackage: false,
            originalPrice: item.price,
          }));
          const fromPackages = (shopCatalog.packages ?? []).map((pkg) => ({
            id: `pkg:${pkg.id}`,
            name: pkg.name,
            price: Number(pkg.finalPrice ?? pkg.price ?? 0),
            duration: "Pacote",
            isPackage: true,
            originalPrice: Number(pkg.basePrice ?? pkg.price ?? 0),
          }));
          return [...fromServices, ...fromPackages];
        }
        return (servicesMap[selectedShop] || []).map((item) => ({ ...item, isPackage: false, originalPrice: item.price }));
      })()
    : [];
  const service = services.find((s) => s.id === selectedService);
  const upsells = service ? getUpsells(service.name) : [];
  const days = getNextDays(7);
  const timeSlots = generateTimeSlots();
  const unavailable = ["10:00", "14:00", "15:30"];
  const filteredBarbershops = barbershops.filter((b) => {
    const q = shopQuery.trim().toLowerCase();
    if (!q) return true;
    return b.name.toLowerCase().includes(q) || b.address.toLowerCase().includes(q);
  });

  const extrasTotal = upsells
    .filter((u) => selectedExtras.includes(u.name))
    .reduce((sum, u) => sum + (u.discount ? u.price * (1 - u.discount / 100) : u.price), 0);
  const totalPrice = (service?.price || 0) + (service?.isPackage ? 0 : extrasTotal);

  const toggleExtra = (name: string) => {
    setSelectedExtras((prev) => (prev.includes(name) ? prev.filter((e) => e !== name) : [...prev, name]));
  };

  const canNext =
    (step === 1 && selectedShop) ||
    (step === 2 && selectedService) ||
    step === 3 ||
    (step === 4 && selectedDate && selectedTime) ||
    step === 5;

  const handleNext = () => {
    if (step < 5) setStep(step + 1);
  };
  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleConfirmPayment = () => {
    setPaymentStatus("processing");
    setTimeout(async () => {
      if (shop && service && user && selectedDay && selectedTime) {
        const profile = getBarbershopProfile(shop.id);
        const location = [profile.endereco, profile.cidade, profile.estado].filter(Boolean).join(", ") || shop.address;
        const nowIso = new Date().toISOString();
        addAppointment(shop.id, {
          clientId: user.id,
          client: user.name,
          barbershopName: profile.nomeBarbearia || shop.name,
          service: service.name,
          date: selectedDay.value,
          time: selectedTime,
          location,
          price: totalPrice,
          durationMinutes: parseDurationToMinutes(service.duration),
          thumbnailUrl: profile.coverPhotoUrl ?? undefined,
          whatsAppPhone: profile.telefone ?? undefined,
          status: "confirmed",
          createdAt: nowIso,
          confirmedAt: nowIso,
        });
        if (selectedExtras.length > 0) {
          const storeProducts = await getStoreProductsByBarbershop(shop.id);
          const normalize = (value: string) => value.trim().toLowerCase();
          const byName = new Map(storeProducts.map((product) => [normalize(product.name), product]));
          for (const extra of selectedExtras) {
            const direct = byName.get(normalize(extra));
            const fuzzy = storeProducts.find((product) => {
              const n1 = normalize(product.name);
              const n2 = normalize(extra);
              return n1.includes(n2) || n2.includes(n1) || product.tags.some((tag) => n2.includes(normalize(tag)));
            });
            const matched = direct ?? fuzzy;
            if (!matched) continue;
            await registerProductSale({
              productId: matched.id,
              barbershopId: shop.id,
              barberId: undefined,
              quantity: 1,
              paymentMethod: "pix",
              source: "appointment_upsell",
            });
          }
        }
      }
      setPaymentStatus("confirmed");
      toast({
        title: "Pagamento confirmado!",
        description: "Seu agendamento foi realizado.",
      });
    }, 3000);
  };

  const handleCopyPix = () => {
    navigator.clipboard.writeText(pixCode).catch(() => undefined);
    toast({ title: "Código Pix copiado", description: "Cole no app do seu banco para pagar." });
  };

  const selectedDay = days.find((d) => d.value === selectedDate);

  useEffect(() => {
    const prefill = (location.state as {
      prefill?: { barbershopId?: number; serviceName?: string; date?: string; time?: string; step?: number };
    } | null)?.prefill;
    if (!prefill?.barbershopId) return;

    setSelectedShop(prefill.barbershopId);
    const candidateServices = servicesMap[prefill.barbershopId] || [];
    const catalog = getBarberCatalog(prefill.barbershopId);
    const catalogServices = catalog.services.map((item) => ({
      id: item.id,
      name: item.name,
    }));
    const allCandidates = [
      ...catalogServices,
      ...candidateServices.map((item) => ({ id: item.id, name: item.name })),
    ];
    if (prefill.serviceName) {
      const found =
        allCandidates.find((s) => s.name.toLowerCase() === prefill.serviceName?.toLowerCase()) ||
        allCandidates.find((s) => prefill.serviceName?.toLowerCase().includes(s.name.toLowerCase()));
      if (found) setSelectedService(found.id);
    }
    if (prefill.date) setSelectedDate(prefill.date);
    if (prefill.time) setSelectedTime(prefill.time);
    setStep(prefill.step ?? (prefill.serviceName ? 3 : 2));
    window.history.replaceState({}, "", location.pathname);
  }, [location.pathname, location.state]);

  return (
    <DashboardLayout userType="cliente">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate("/cliente/agendamentos")}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="font-display text-2xl lg:text-3xl font-bold">Novo agendamento</h1>
            <p className="text-muted-foreground text-sm">Siga os passos para escolher barbearia, serviço e horário.</p>
          </div>
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-1.5 mb-8 overflow-x-auto pb-2">
          {steps.map((s, i) => (
            <div key={s.id} className="flex items-center gap-1.5">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  step === s.id
                    ? "bg-primary/15 text-primary"
                    : step > s.id
                    ? "bg-green-500/10 text-green-400"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {step > s.id ? <Check className="h-3.5 w-3.5" /> : <s.icon className="h-3.5 w-3.5" />}
                <span className="hidden sm:inline">{s.label}</span>
              </motion.div>
              {i < steps.length - 1 && (
                <div className={`w-4 h-px ${step > s.id ? "bg-green-400/50" : "bg-border"}`} />
              )}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Barbearia */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-3"
            >
              <h2 className="font-display text-lg font-semibold mb-4">Escolha a barbearia</h2>
              <div className="relative mb-3">
                <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  value={shopQuery}
                  onChange={(e) => setShopQuery(e.target.value)}
                  placeholder='Pesquisar barbearia (ex: "Premium", "Paulista")'
                  className="pl-9 bg-card/90 border-border/60"
                />
              </div>
              {filteredBarbershops.length === 0 && (
                <div className="rounded-xl border border-border/60 bg-card/60 p-4 text-sm text-muted-foreground">
                  Nenhuma barbearia encontrada para sua pesquisa.
                </div>
              )}
              {filteredBarbershops.map((b) => (
                <motion.button
                  key={b.id}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setSelectedShop(b.id);
                    setSelectedService(null);
                    setSelectedExtras([]);
                  }}
                  className={`w-full text-left bg-card border rounded-xl p-4 shadow-card transition-all ${
                    selectedShop === b.id
                      ? "border-primary ring-1 ring-primary/30"
                      : "border-border/50 hover:border-primary/30"
                  }`}
                >
                  {(() => {
                    const profile = getBarbershopProfile(b.id);
                    const coverUrl = profile.coverPhotoUrl?.trim();
                    return (
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="w-14 h-14 rounded-xl overflow-hidden border border-border/60 bg-secondary/40 shrink-0">
                            {coverUrl ? (
                              <img src={coverUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Store className="w-6 h-6 text-muted-foreground/50" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold truncate">{profile.nomeBarbearia?.trim() || b.name}</p>
                            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1 truncate">
                              <MapPin className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate">
                                {[profile.endereco, profile.cidade, profile.estado].filter(Boolean).join(", ") || b.address}
                              </span>
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-primary font-semibold">★ {b.rating}</span>
                          <p className="text-xs text-muted-foreground">{b.reviews} avaliações</p>
                        </div>
                      </div>
                    );
                  })()}
                </motion.button>
              ))}
            </motion.div>
          )}

          {/* Step 2: Serviço */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-3"
            >
              <h2 className="font-display text-lg font-semibold mb-1">Escolha o serviço</h2>
              <p className="text-sm text-muted-foreground mb-4">{shop?.name}</p>
              {services.map((s) => (
                <motion.button
                  key={s.id}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setSelectedService(s.id);
                    setSelectedExtras([]);
                  }}
                  className={`w-full text-left bg-card border rounded-xl p-4 shadow-card transition-all ${
                    selectedService === s.id
                      ? "border-primary ring-1 ring-primary/30"
                      : "border-border/50 hover:border-primary/30"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold">{s.name}</p>
                      {s.isPackage && (
                        <p className="text-[11px] text-emerald-400 mt-1">
                          Pacote com economia de R$ {Math.max(0, (s.originalPrice || s.price) - s.price).toFixed(2)}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <Clock className="h-3.5 w-3.5" /> {s.duration}
                      </p>
                    </div>
                    <div className="text-right">
                      {s.isPackage && (
                        <span className="text-xs text-muted-foreground line-through block">
                          R$ {(s.originalPrice || s.price).toFixed(2)}
                        </span>
                      )}
                      <span className="font-display text-lg font-bold text-primary">R$ {Number(s.price).toFixed(2)}</span>
                    </div>
                  </div>
                </motion.button>
              ))}
            </motion.div>
          )}

          {/* Step 3: Extras */}
          {step === 3 && service && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h2 className="font-display text-lg font-semibold">Deseja adicionar algo?</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Recomendações especiais para complementar seu{" "}
                <span className="text-primary font-medium">{service.name}</span>
              </p>

              {service.isPackage ? (
                <div className="rounded-xl border border-primary/30 bg-primary/10 p-4 text-sm text-muted-foreground">
                  Pacote selecionado. Os extras já estão incluídos na oferta, então você pode seguir para data e hora.
                </div>
              ) : (
                <div className="space-y-3">
                  {upsells.map((upsell) => {
                  const isSelected = selectedExtras.includes(upsell.name);
                  const final = upsell.discount
                    ? upsell.price * (1 - upsell.discount / 100)
                    : upsell.price;
                  return (
                    <motion.button
                      key={upsell.name}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => toggleExtra(upsell.name)}
                      className={`w-full text-left bg-card border rounded-xl p-4 shadow-card transition-all ${
                        isSelected ? "border-primary ring-1 ring-primary/30" : "border-border/50 hover:border-primary/30"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <span className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                            <upsell.icon className="w-4 h-4 text-primary" />
                          </span>
                          <div>
                            <p className="font-semibold text-sm">{upsell.name}</p>
                            {upsell.discount && (
                              <span className="text-xs bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full font-medium">
                                -{upsell.discount}% desconto
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            {upsell.discount && (
                              <span className="text-xs text-muted-foreground line-through block">
                                R$ {upsell.price}
                              </span>
                            )}
                            <span className="font-display font-bold text-primary">
                              +R$ {final.toFixed(0)}
                            </span>
                          </div>
                          <div
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                              isSelected ? "bg-primary border-primary" : "border-border"
                            }`}
                          >
                            {isSelected && <Check className="h-3.5 w-3.5 text-primary-foreground" />}
                          </div>
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
              )}

              {selectedExtras.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-primary/5 border border-primary/20 rounded-xl p-4"
                >
                  <div className="flex justify-between text-sm">
                    <span>Serviço: {service.name}</span>
                    <span>R$ {service.price}</span>
                  </div>
                  {selectedExtras.map((name) => {
                    const u = upsells.find((x) => x.name === name)!;
                    const fp = u.discount ? u.price * (1 - u.discount / 100) : u.price;
                    return (
                      <div key={name} className="flex justify-between text-sm text-muted-foreground mt-1">
                        <span>+ {name}</span>
                        <span>R$ {fp.toFixed(0)}</span>
                      </div>
                    );
                  })}
                  <div className="h-px bg-border my-2" />
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span className="text-primary font-display font-bold">
                      R$ {totalPrice.toFixed(0)}
                    </span>
                  </div>
                </motion.div>
              )}

              <p className="text-xs text-muted-foreground text-center">
                Esses extras são opcionais. Você pode pular se preferir.
              </p>
            </motion.div>
          )}

          {/* Step 4: Data & Hora */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h2 className="font-display text-lg font-semibold mb-4">Escolha data e horário</h2>
              <div className="flex gap-2 overflow-x-auto pb-3 mb-6">
                {days.map((d) => (
                  <motion.button
                    key={d.value}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedDate(d.value)}
                    className={`flex flex-col items-center min-w-[60px] px-3 py-3 rounded-xl border text-sm transition-all ${
                      selectedDate === d.value
                        ? "bg-primary/15 border-primary text-primary"
                        : "bg-card border-border/50 hover:border-primary/30"
                    }`}
                  >
                    <span className="text-xs text-muted-foreground">{d.weekday}</span>
                    <span className="font-semibold mt-1">{d.label}</span>
                  </motion.button>
                ))}
              </div>
              {selectedDate && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <p className="text-sm text-muted-foreground mb-3">Horários disponíveis</p>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {timeSlots.map((t) => {
                      const isUnavailable = unavailable.includes(t);
                      return (
                        <motion.button
                          key={t}
                          whileHover={!isUnavailable ? { scale: 1.05 } : {}}
                          whileTap={!isUnavailable ? { scale: 0.95 } : {}}
                          disabled={isUnavailable}
                          onClick={() => setSelectedTime(t)}
                          className={`py-2.5 rounded-lg text-sm font-medium transition-all ${
                            isUnavailable
                              ? "bg-muted/50 text-muted-foreground/40 cursor-not-allowed line-through"
                              : selectedTime === t
                              ? "bg-primary text-primary-foreground shadow-gold"
                              : "bg-card border border-border/50 hover:border-primary/30"
                          }`}
                        >
                          {t}
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Step 5: Pagamento */}
          {step === 5 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h2 className="font-display text-lg font-semibold mb-4">Confirmação & Pagamento</h2>

              <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-card mb-6 space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                  Resumo
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Barbearia</span>
                    <span className="font-medium">{shop?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Serviço</span>
                    <span className="font-medium">{service?.name}</span>
                  </div>
                  {selectedExtras.map((name) => (
                    <div key={name} className="flex justify-between text-xs text-muted-foreground">
                      <span>+ {name}</span>
                      <span>
                        R$ {(upsells.find((u) => u.name === name)?.price || 0).toFixed(0)}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Data</span>
                    <span className="font-medium">
                      {selectedDay?.label} ({selectedDay?.weekday})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Horário</span>
                    <span className="font-medium">{selectedTime}</span>
                  </div>
                  <div className="h-px bg-border my-2" />
                  <div className="flex justify-between text-base">
                    <span className="font-semibold">Total</span>
                    <span className="font-display font-bold text-primary">
                      R$ {totalPrice.toFixed(0)}
                    </span>
                  </div>
                </div>
              </div>

              {paymentStatus === "pending" && (
                <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-card text-center space-y-4">
                  <h3 className="font-semibold">Pague via Pix</h3>
                  <div className="w-48 h-48 mx-auto bg-background rounded-xl border border-border/50 flex items-center justify-center">
                    <QrCode className="h-32 w-32 text-primary/60" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Escaneie o QR Code ou copie o código abaixo
                  </p>
                  <div className="bg-background rounded-lg p-3 text-xs text-muted-foreground break-all font-mono max-h-16 overflow-hidden">
                    {pixCode.substring(0, 80)}...
                  </div>
                  <div className="flex gap-3 justify-center">
                    <Button variant="gold-outline" size="sm" onClick={handleCopyPix}>
                      <Copy className="h-4 w-4 mr-2" /> Copiar código
                    </Button>
                    <Button variant="gold" size="sm" onClick={handleConfirmPayment}>
                      Já paguei
                    </Button>
                  </div>
                </div>
              )}

              {paymentStatus === "processing" && (
                <div className="bg-card border border-border/50 rounded-2xl p-8 shadow-card text-center space-y-4">
                  <div className="w-12 h-12 mx-auto rounded-full border-2 border-primary border-t-transparent animate-spin" />
                  <p className="font-semibold">Verificando pagamento...</p>
                </div>
              )}

              {paymentStatus === "confirmed" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-card border border-green-500/30 rounded-2xl p-8 shadow-card text-center space-y-4"
                >
                  <div className="w-16 h-16 mx-auto rounded-full bg-green-500/10 flex items-center justify-center">
                    <Check className="h-8 w-8 text-green-400" />
                  </div>
                  <h3 className="font-display text-xl font-bold">Agendamento confirmado!</h3>
                  <p className="text-sm text-muted-foreground">
                    {service?.name} em {shop?.name}
                    <br />
                    {selectedDay?.label} às {selectedTime}
                  </p>
                  <Button variant="gold" onClick={() => navigate("/cliente/agendamentos")}>
                    Ver meus agendamentos
                  </Button>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {paymentStatus === "pending" && (
          <div className="flex justify-between mt-8">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={step === 1}
              className="text-muted-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
            </Button>
            {step < 5 && (
              <Button variant="gold" onClick={handleNext} disabled={!canNext}>
                {step === 3 && selectedExtras.length === 0 ? "Pular" : "Próximo"}{" "}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        )}
      </motion.div>
    </DashboardLayout>
  );
};

export default ClientNewAppointment;

