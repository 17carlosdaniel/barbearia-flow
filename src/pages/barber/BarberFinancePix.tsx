import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { QrCode, CreditCard, Banknote, Pencil, Copy, Check, Lightbulb } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { getBarbershopProfile, setBarbershopProfile } from "@/lib/barbershopProfile";
import { cn } from "@/lib/utils";

const PIX_KEY_DEFAULT = "barberflow@email.com";

const generateQrPattern = (seedText: string, size = 21) => {
  let seed = seedText.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) || 7;
  const next = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
  return Array.from({ length: size * size }, (_, index) => {
    const row = Math.floor(index / size);
    const col = index % size;
    const finder = (row < 7 && col < 7) || (row < 7 && col >= size - 7) || (row >= size - 7 && col < 7);
    if (finder) {
      const r = row % 7;
      const c = col % 7;
      return r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4);
    }
    return next() > 0.52;
  });
};

type PaymentMethodState = {
  id: string;
  label: string;
  desc: string;
  icon: typeof QrCode;
  active: boolean;
  iconClassName: string;
};

const BarberFinancePix = () => {
  const { user } = useAuth();
  const { identity } = useTheme();
  const isModern = identity === "modern";
  const barbershopId = user?.barbershopId ?? 1;
  const profile = getBarbershopProfile(barbershopId);
  const pixKey = (profile.pixChave ?? "").trim() || PIX_KEY_DEFAULT;

  const [pixCopied, setPixCopied] = useState(false);
  const [editPixOpen, setEditPixOpen] = useState(false);
  const [editPixValue, setEditPixValue] = useState(pixKey);
  const [showQrCode, setShowQrCode] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodState[]>([
    { id: "pix", label: "Pix", desc: "Pagamento instantâneo", icon: QrCode, active: true, iconClassName: "text-emerald-400" },
    { id: "card", label: "Cartão de Crédito/Débito", desc: "Visa, Master, Elo", icon: CreditCard, active: true, iconClassName: "text-sky-400" },
    { id: "cash", label: "Dinheiro", desc: "Pagamento em espécie", icon: Banknote, active: true, iconClassName: "text-green-400" },
  ]);
  const qrCells = useMemo(() => generateQrPattern(pixKey), [pixKey]);

  const handleCopyPix = () => {
    navigator.clipboard.writeText(pixKey);
    setPixCopied(true);
    toast.success("Chave Pix copiada!");
    setTimeout(() => setPixCopied(false), 2000);
  };

  const openEditPix = () => {
    setEditPixValue(pixKey);
    setEditPixOpen(true);
  };

  const savePixKey = () => {
    const value = editPixValue.trim();
    if (!value) {
      toast.error("Informe uma chave Pix.");
      return;
    }
    setBarbershopProfile(barbershopId, { pixChave: value });
    setEditPixOpen(false);
    toast.success("Chave Pix atualizada!");
  };

  const toggleMethod = (id: string, enabled: boolean) => {
    setPaymentMethods((prev) => prev.map((item) => (item.id === id ? { ...item, active: enabled } : item)));
  };

  const pixRevenueShare = 42;

  return (
    <DashboardLayout userType="barbeiro">
      <div className="space-y-6">
        <div>
          <p className="text-xs text-muted-foreground mb-1">
            <Link to="/barbeiro/financeiro" className="hover:text-primary">
              Recebimentos
            </Link>{" "}
            / Pix
          </p>
          <h1 className="font-display text-2xl lg:text-3xl font-bold">{isModern ? "Pagamentos e Pix" : "Configurar Pix"}</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {isModern
              ? "Gerencie a chave Pix e os meios de pagamento usados no checkout."
              : "Defina a chave Pix e os meios de pagamento aceitos no atendimento."}
          </p>
        </div>

        <div className={cn("bg-card border border-border/50 p-6 shadow-lg", isModern ? "rounded-2xl" : "rounded-xl")}>
          <h3 className={cn("text-lg font-semibold mb-4 flex items-center gap-2", !isModern && "font-vintage-display")}>
            <QrCode className="h-5 w-5 text-primary" /> {isModern ? "Recebimento via Pix" : "Chave Pix cadastrada"}
          </h3>
          <div className="rounded-xl border border-border/40 bg-muted/30 p-4">
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_auto] gap-4 items-start">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/25 flex items-center justify-center shrink-0">
                  <QrCode className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">Chave Pix</p>
                  <p className="font-mono text-base sm:text-lg font-semibold text-foreground truncate">{pixKey}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button variant="default" size="sm" onClick={() => setShowQrCode((prev) => !prev)} className="gap-1.5">
                  <QrCode className="h-4 w-4" />
                  {showQrCode ? "Ocultar QR" : "Gerar QR"}
                </Button>
                <Button variant="outline" size="sm" onClick={openEditPix} className="gap-1.5">
                  <Pencil className="h-4 w-4" />
                  Editar chave
                </Button>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  animate={pixCopied ? { scale: [1, 1.1, 1] } : { scale: 1 }}
                  transition={{ duration: 0.25 }}
                  onClick={handleCopyPix}
                  className="inline-flex items-center justify-center border border-border rounded-md px-3 h-9 hover:bg-muted/60"
                  aria-label="Copiar chave"
                >
                  {pixCopied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                </motion.button>
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            {isModern
              ? "Use esta chave para receber pagamentos diretamente após o atendimento. Ideal para fechamento rápido no checkout."
              : "Essa chave pode ser usada para pagamentos rápidos no caixa, com praticidade no atendimento da casa."}
          </p>
          <AnimatePresence>
            {showQrCode && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className="mt-4 rounded-xl border border-border/50 bg-secondary/30 p-4"
              >
                <div className="flex items-center gap-4">
                  <div className="w-[168px] h-[168px] rounded-lg bg-background p-2 border border-border/60 shadow-sm">
                    <div className="grid w-full h-full" style={{ gridTemplateColumns: "repeat(21, minmax(0, 1fr))" }}>
                      {qrCells.map((filled, idx) => (
                        <span key={idx} className={filled ? "bg-foreground" : "bg-transparent"} />
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">QR Code pronto</p>
                    <p className="text-xs text-muted-foreground">
                      {isModern ? "Mostre este QR ao cliente para checkout rápido." : "Mostre este QR ao cliente para pagamento rápido."}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <Dialog open={editPixOpen} onOpenChange={setEditPixOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Editar chave Pix</DialogTitle>
              <DialogDescription>Informe a chave Pix que você usa para receber pagamentos.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <Label htmlFor="pix-key" className="text-foreground">
                Chave Pix
              </Label>
              <Input id="pix-key" type="text" placeholder="seu@email.com ou 11999990000" value={editPixValue} onChange={(e) => setEditPixValue(e.target.value)} className="font-mono" />
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setEditPixOpen(false)}>
                Cancelar
              </Button>
              <Button variant="default" onClick={savePixKey}>
                Salvar chave
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className={cn("bg-card border border-border/50 p-6 shadow-lg", isModern ? "rounded-2xl" : "rounded-xl")}>
          <h3 className={cn("text-lg font-semibold mb-4 flex items-center gap-2", !isModern && "font-vintage-display")}>
            <CreditCard className="h-5 w-5 text-primary" /> {isModern ? "Métodos ativos no checkout" : "Formas de pagamento aceitas"}
          </h3>
          <div className="space-y-3">
            {paymentMethods.map((pm) => (
              <motion.div
                key={pm.id}
                className={`flex items-center gap-4 p-4 min-h-[74px] rounded-xl bg-muted/25 border border-border/35 transition-all ${pm.active ? "" : "opacity-60 grayscale"}`}
                layout
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <pm.icon className={`h-5 w-5 ${pm.iconClassName}`} />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm text-foreground">{pm.label}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {isModern
                      ? pm.desc
                      : pm.id === "pix"
                        ? "Recebimento instantâneo"
                        : pm.id === "cash"
                          ? "Recebimento em espécie"
                          : pm.desc}
                  </p>
                </div>
                <Switch
                  checked={pm.active}
                  onCheckedChange={(checked) => toggleMethod(pm.id, checked)}
                  className={cn(
                    isModern && "h-5 w-10 border border-white/15 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input/80 [&>span]:h-4 [&>span]:w-4 [&>span]:data-[state=checked]:translate-x-5",
                    !isModern && "h-6 w-11 border border-primary/30 data-[state=checked]:bg-primary/90 data-[state=unchecked]:bg-muted/70 [&>span]:h-5 [&>span]:w-5 [&>span]:bg-card",
                  )}
                />
              </motion.div>
            ))}
          </div>
        </div>

        <div className={cn("glass-card border border-primary/25 p-5 bg-primary/5", isModern ? "rounded-2xl" : "rounded-xl")}>
          <p className="text-xs uppercase tracking-wide text-primary/90 font-semibold inline-flex items-center gap-1.5">
            <Lightbulb className="h-4 w-4 text-primary" />
            Insight de recebimento
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            {isModern ? (
              <>
                <span className="text-primary font-semibold">{pixRevenueShare}%</span> dos pagamentos deste mês foram via Pix. Vale testar um incentivo simples para pagamentos em dinheiro e acompanhar o resultado.
              </>
            ) : (
              <>
                <span className="text-primary font-semibold">{pixRevenueShare}%</span> dos recebimentos do mês vieram via Pix. Um incentivo em espécie pode equilibrar os meios de pagamento.
              </>
            )}
          </p>
        </div>

        <div className="flex items-center">
          <Button variant="ghost" asChild>
            <Link to="/barbeiro/financeiro">Voltar aos recebimentos</Link>
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default BarberFinancePix;
