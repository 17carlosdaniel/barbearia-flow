import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CreditCard,
  Landmark,
  Smartphone,
  CheckCircle2,
  ShieldCheck,
  Lock,
  Clock3,
  Headset,
  Truck,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ShopCartItem } from "@/types/shop";
import { toast } from "@/hooks/use-toast";
import CheckoutStepper from "@/components/shop/CheckoutStepper";
import type { Barbershop } from "@/lib/mockBarbershops";
import { useAuth } from "@/contexts/AuthContext";
import {
  formatCardNumber,
  formatExpiry,
  isExpiryValid,
  loadSavedPaymentCards,
  SavedPaymentCard,
  setDefaultSavedPaymentCard,
} from "@/lib/paymentCards";

interface CheckoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: ShopCartItem[];
  subtotal: number;
  shipping: number;
  discount: number;
  couponCode?: string;
  total: number;
  barbershop?: Barbershop;
  onConfirm: (data: {
    name: string;
    email: string;
    phone: string;
    method: "pix" | "card" | "boleto";
    pickupInStore: boolean;
    address?: {
      cep: string;
      street: string;
      number: string;
      neighborhood: string;
      city: string;
      state: string;
    };
    shipping: number;
  }) => void | Promise<void>;
}

const PAYMENT_METHODS = [
  { id: "pix", label: "PIX", icon: Smartphone },
  { id: "card", label: "Cartão", icon: CreditCard },
  { id: "boleto", label: "Boleto", icon: Landmark },
];

const formatPhone = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits ? `(${digits}` : "";
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

const normalizeEmailInput = (value: string) =>
  value
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9._%+-@]/g, "")
    .slice(0, 254);

const isEmailFormatValid = (value: string) =>
  /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(value);

const CheckoutModal = ({
  open,
  onOpenChange,
  items,
  subtotal,
  shipping,
  discount,
  couponCode,
  total,
  barbershop,
  onConfirm,
}: CheckoutModalProps) => {
  const { user } = useAuth();
  const [step, setStep] = React.useState(1);
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [method, setMethod] = React.useState<"pix" | "card" | "boleto">("pix");
  const [pickupInStore] = React.useState(true);
  const [address, setAddress] = React.useState({
    cep: "",
    street: "",
    number: "",
    neighborhood: "",
    city: "",
    state: "",
  });
  const [installments, setInstallments] = React.useState("1");
  const [cardNumber, setCardNumber] = React.useState("");
  const [cardExpiry, setCardExpiry] = React.useState("");
  const [cardCvv, setCardCvv] = React.useState("");
  const [savedCards, setSavedCards] = React.useState<SavedPaymentCard[]>([]);
  const [selectedSavedCardId, setSelectedSavedCardId] = React.useState<string | null>(null);
  const [pixCopied, setPixCopied] = React.useState(false);
  const [pixSecondsLeft, setPixSecondsLeft] = React.useState(10 * 60);
  const [submitting, setSubmitting] = React.useState(false);
  const [submitSuccess, setSubmitSuccess] = React.useState(false);

  const phoneDigits = React.useMemo(() => phone.replace(/\D/g, ""), [phone]);
  const emailValid = React.useMemo(() => isEmailFormatValid(email), [email]);
  const canProceedFromStep1 = Boolean(
    name.trim() &&
      emailValid &&
      phoneDigits.length >= 10 &&
      phoneDigits.length <= 11,
  );
  const canProceedFromStep2 = pickupInStore
    ? true
    : Boolean(
        address.cep.trim() &&
          address.street.trim() &&
          address.number.trim() &&
          address.neighborhood.trim() &&
          address.city.trim() &&
          address.state.trim(),
      );

  const canProceed = step === 1 ? canProceedFromStep1 : step === 2 ? canProceedFromStep2 : true;
  const pixDiscountValue = method === "pix" ? subtotal * 0.05 : 0;
  const shippingValue = pickupInStore ? 0 : shipping;
  const finalTotal = subtotal + shippingValue - discount - pixDiscountValue;
  const cardBrand = React.useMemo(() => {
    const normalized = cardNumber.replace(/\s/g, "");
    if (normalized.startsWith("4")) return "Visa";
    if (/^5[1-5]/.test(normalized) || /^2(2[2-9]|[3-6]|7[01]|720)/.test(normalized)) return "Mastercard";
    if (/^3[47]/.test(normalized)) return "Amex";
    if (/^6(?:011|5)/.test(normalized)) return "Elo/Discover";
    return "";
  }, [cardNumber]);
  const selectedSavedCard = React.useMemo(
    () => savedCards.find((card) => card.id === selectedSavedCardId) ?? null,
    [savedCards, selectedSavedCardId],
  );
  const cardNumberDigits = React.useMemo(() => cardNumber.replace(/\D/g, ""), [cardNumber]);
  const canPayWithCard =
    selectedSavedCard != null ||
    (cardNumberDigits.length >= 13 &&
      cardNumberDigits.length <= 16 &&
      isExpiryValid(cardExpiry) &&
      /^[0-9]{3,4}$/.test(cardCvv));
  const pixMinutes = Math.floor(pixSecondsLeft / 60);
  const pixSeconds = String(pixSecondsLeft % 60).padStart(2, "0");

  React.useEffect(() => {
    if (!open || step !== 3 || method !== "pix") return;
    const timer = window.setInterval(() => {
      setPixSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [open, step, method]);

  React.useEffect(() => {
    if (!open) return;
    const loaded = loadSavedPaymentCards(user?.id);
    setSavedCards(loaded);
    const defaultCard = loaded.find((card) => card.isDefault) ?? loaded[0] ?? null;
    if (defaultCard) {
      setSelectedSavedCardId(defaultCard.id);
      setCardNumber(`**** **** **** ${defaultCard.last4}`);
      setCardExpiry(defaultCard.expiry);
      setCardCvv("");
    }
  }, [open, user?.id]);

  const resetForm = () => {
    setStep(1);
    setName("");
    setEmail("");
    setPhone("");
    setMethod("pix");
    setAddress({ cep: "", street: "", number: "", neighborhood: "", city: "", state: "" });
    setInstallments("1");
    setCardNumber("");
    setCardExpiry("");
    setCardCvv("");
    setSavedCards([]);
    setSelectedSavedCardId(null);
    setPixCopied(false);
    setPixSecondsLeft(10 * 60);
    setSubmitting(false);
    setSubmitSuccess(false);
  };

  const finalizeOrder = async () => {
    if (step !== 3 || submitting) return;
    setSubmitting(true);
    await Promise.resolve(
      onConfirm({
      name,
      email,
      phone,
      method,
      pickupInStore,
      address: pickupInStore ? undefined : address,
      shipping: pickupInStore ? 0 : shipping,
      }),
    );
    setSubmitSuccess(true);
    setTimeout(() => {
      setSubmitting(false);
      setSubmitSuccess(false);
      onOpenChange(false);
      resetForm();
    }, 900);
  };

  const handleNext = () => {
    if (!canProceed) return;
    setStep((prev) => Math.min(3, prev + 1));
  };

  const handleBack = () => {
    setStep((prev) => Math.max(1, prev - 1));
  };

  const onFormKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key !== "Enter") return;
    if (step === 3) {
      // Evita finalizar pedido por Enter acidental ao entrar na etapa 3.
      e.preventDefault();
      return;
    }
    const target = e.target as HTMLElement;
    const tagName = target.tagName.toLowerCase();
    if (tagName === "textarea") return;
    e.preventDefault();
    handleNext();
  };

  React.useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-xl"
        onInteractOutside={(e) => {
          e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            Checkout seguro
          </DialogTitle>
          <DialogDescription>
            Seus dados estao protegidos. Finalize seu pedido com tranquilidade.
          </DialogDescription>
        </DialogHeader>
        <CheckoutStepper step={step} />
        <div className="rounded-lg border border-border/60 bg-secondary/20 px-3 py-2 text-xs flex flex-wrap items-center gap-2">
          <span className={step > 1 ? "text-primary" : "text-muted-foreground"}>{step > 1 ? "✓" : "•"} Identificacao</span>
          <span className="text-muted-foreground">/</span>
          <span className={step > 2 ? "text-primary" : step === 2 ? "text-foreground" : "text-muted-foreground"}>
            {step > 2 ? "✓" : step === 2 ? "→" : "•"} Entrega
          </span>
          <span className="text-muted-foreground">/</span>
          <span className={step === 3 ? "text-foreground" : "text-muted-foreground"}>
            {step === 3 ? "→" : "•"} Pagamento
          </span>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
          }}
          onKeyDown={onFormKeyDown}
          className="space-y-4 py-2"
        >
          <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step-1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <>
              <div className="space-y-2">
                <Label className="text-sm text-foreground/80">Nome</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" required className="h-9" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-foreground/80">E-mail</Label>
                <Input
                  value={email}
                  onChange={(e) => setEmail(normalizeEmailInput(e.target.value))}
                  placeholder="voce@email.com"
                  required
                  className="h-9"
                />
                {email.length > 0 && !emailValid && (
                  <p className="text-xs text-destructive">Informe um e-mail válido.</p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-foreground/80">Telefone</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(formatPhone(e.target.value))}
                  placeholder="(11) 99999-9999"
                  required
                  className="h-9"
                />
                {phoneDigits.length > 0 && phoneDigits.length < 10 && (
                  <p className="text-xs text-destructive">Informe um telefone válido com DDD.</p>
                )}
              </div>
            </>
            </motion.div>
          )}
          {step === 2 && (
            <motion.div key="step-2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <>
              <div className="rounded-lg border border-primary/40 bg-primary/10 px-3 py-3">
                <p className="text-sm text-foreground font-medium">Retirada obrigatória na barbearia do produto</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {barbershop
                    ? `${barbershop.name} — ${barbershop.location}`
                    : "Local de retirada definido pela barbearia do item."}
                </p>
              </div>
              {!pickupInStore && (
                <div className="space-y-2">
                  <Label className="text-sm text-foreground/80">CEP</Label>
                  <Input
                    value={address.cep}
                    onChange={(e) => setAddress((p) => ({ ...p, cep: e.target.value }))}
                    placeholder="00000-000"
                    className="h-9"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input placeholder="Rua" value={address.street} onChange={(e) => setAddress((p) => ({ ...p, street: e.target.value }))} />
                    <Input placeholder="Número" value={address.number} onChange={(e) => setAddress((p) => ({ ...p, number: e.target.value }))} />
                    <Input placeholder="Bairro" value={address.neighborhood} onChange={(e) => setAddress((p) => ({ ...p, neighborhood: e.target.value }))} />
                    <Input placeholder="Cidade" value={address.city} onChange={(e) => setAddress((p) => ({ ...p, city: e.target.value }))} />
                  </div>
                  <Input placeholder="UF" value={address.state} onChange={(e) => setAddress((p) => ({ ...p, state: e.target.value }))} />
                </div>
              )}
            </>
            </motion.div>
          )}
          {step === 3 && (
            <motion.div key="step-3" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <>
              <div className="space-y-4">
                <Label className="text-sm text-foreground/80">Forma de pagamento</Label>
                <div className="flex gap-2">
                  {PAYMENT_METHODS.map((m) => {
                    const Icon = m.icon;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          setMethod(m.id as "pix" | "card" | "boleto");
                          if (m.id === "pix") setPixSecondsLeft(10 * 60);
                        }}
                        className={`flex-1 flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                          method === m.id
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border/60 hover:bg-secondary/50"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {m.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <AnimatePresence mode="wait">
                {method === "pix" && (
                  <motion.div
                    key="payment-pix"
                    initial={{ opacity: 0, y: 10, scale: 0.99 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.99 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="mt-2 rounded-lg border border-border/60 p-3.5 space-y-3"
                  >
                    <div className="mt-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-xs text-emerald-300 flex items-center justify-between gap-2">
                      <span className="leading-none">PIX com 5% de desconto no pagamento</span>
                      <span className="font-semibold whitespace-nowrap">-R$ {pixDiscountValue.toFixed(2)}</span>
                    </div>
                    <p className="text-xs text-amber-300 flex items-center gap-1 pt-0.5">
                      <Clock3 className="w-3.5 h-3.5" />
                      Expira em {pixMinutes}:{pixSeconds}
                    </p>
                    <p className="text-sm text-foreground">QR Code PIX (simulado)</p>
                    <div className="w-32 h-32 bg-secondary/70 rounded-md mx-auto" />
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        navigator.clipboard.writeText("00020126580014BR.GOV.BCB.PIX0136BARBERFLOW-PIX-CODE-MOCK");
                        toast({ title: "Código PIX copiado" });
                        setPixCopied(true);
                        window.setTimeout(() => setPixCopied(false), 1800);
                      }}
                    >
                      {pixCopied ? "Codigo copiado!" : "Copiar codigo PIX"}
                    </Button>
                  </motion.div>
                )}
                {method === "card" && (
                  <motion.div
                    key="payment-card"
                    initial={{ opacity: 0, y: 10, scale: 0.99 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.99 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="mt-2 space-y-3"
                  >
                    <div className="mt-1 rounded-lg border border-primary/25 bg-primary/8 px-3 py-2.5 text-xs text-primary flex items-center justify-between gap-2">
                      <span className="leading-none">Parcelamento em ate 3x sem juros</span>
                      <span className="font-semibold whitespace-nowrap">Ate 3x</span>
                    </div>
                    {savedCards.length > 0 && (
                      <div className="rounded-lg border border-border/60 bg-secondary/20 p-3 space-y-2">
                        <p className="text-xs text-muted-foreground">Cartoes salvos</p>
                        <div className="flex flex-wrap gap-2">
                          {savedCards.map((card) => (
                            <button
                              key={card.id}
                              type="button"
                              onClick={() => {
                                setSelectedSavedCardId(card.id);
                                setCardNumber(`**** **** **** ${card.last4}`);
                                setCardExpiry(card.expiry);
                                setCardCvv("");
                              }}
                              className={`rounded-md border px-2.5 py-1.5 text-xs transition-colors ${
                                selectedSavedCardId === card.id
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "border-border/60 text-muted-foreground hover:bg-secondary/60"
                              }`}
                            >
                              {card.brand} •••• {card.last4}
                            </button>
                          ))}
                        </div>
                        {selectedSavedCardId && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const updated = setDefaultSavedPaymentCard(user?.id, selectedSavedCardId);
                              setSavedCards(updated);
                              toast({ title: "Cartao padrao atualizado" });
                            }}
                          >
                            Usar este como padrao
                          </Button>
                        )}
                      </div>
                    )}
                    <Input
                      placeholder="Numero do cartao"
                      value={cardNumber}
                      onChange={(e) => {
                        setSelectedSavedCardId(null);
                        setCardNumber(formatCardNumber(e.target.value));
                      }}
                    />
                    {(selectedSavedCard?.brand || cardBrand) ? (
                      <p className="text-xs text-muted-foreground">Bandeira detectada: {selectedSavedCard?.brand ?? cardBrand}</p>
                    ) : null}
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        placeholder="Validade MM/AA"
                        value={cardExpiry}
                        onChange={(e) => {
                          setSelectedSavedCardId(null);
                          setCardExpiry(formatExpiry(e.target.value));
                        }}
                      />
                      <Input
                        placeholder="CVV"
                        type="password"
                        inputMode="numeric"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      />
                    </div>
                    <Input value={installments} onChange={(e) => setInstallments(e.target.value)} placeholder="Parcelas (1 a 3)" />
                    {!canPayWithCard && (
                      <p className="text-xs text-destructive">
                        Preencha cartao, validade e CVV validos ou selecione um cartao salvo.
                      </p>
                    )}
                  </motion.div>
                )}
                {method === "boleto" && (
                  <motion.div
                    key="payment-boleto"
                    initial={{ opacity: 0, y: 10, scale: 0.99 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.99 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="mt-2 rounded-lg border border-border/60 p-3.5 space-y-3"
                  >
                    <p className="text-sm text-foreground">Linha digitavel (simulada)</p>
                    <p className="text-xs font-mono text-muted-foreground break-all">
                      34191.79001 01043.510047 91020.150008 7 10010000012990
                    </p>
                    <div className="rounded-lg border border-primary/20 bg-primary/8 px-3 py-2.5 text-xs text-muted-foreground space-y-1">
                      <p className="leading-none">Vencimento em 3 dias.</p>
                      <p className="leading-none">Boleto enviado para seu e-mail apos a confirmacao.</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
            </motion.div>
          )}
          </AnimatePresence>
          <div className="space-y-2 text-sm pt-3 mt-1 border-t border-border/60">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>R$ {subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Frete</span><span className={shippingValue === 0 ? "text-emerald-400 font-medium" : ""}>{shippingValue === 0 ? "Gratis" : `R$ ${shippingValue.toFixed(2)}`}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Desconto</span><span>-R$ {discount.toFixed(2)}</span></div>
            {method === "pix" && <div className="flex justify-between"><span className="text-muted-foreground">Desconto PIX (5%)</span><span>-R$ {pixDiscountValue.toFixed(2)}</span></div>}
            {couponCode && <div className="flex justify-between"><span className="text-muted-foreground">Cupom</span><span>{couponCode}</span></div>}
          </div>
          <div className="flex justify-between text-sm pt-3 border-t border-border/60">
            <span className="text-muted-foreground">Total</span>
            <span className="font-bold text-foreground">
              R$ {finalTotal.toFixed(2)}
            </span>
          </div>
          <DialogFooter className="pt-1">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            {step > 1 && (
              <Button type="button" variant="outline" onClick={handleBack} disabled={submitting}>
                Voltar
              </Button>
            )}
            {step < 3 ? (
              <Button
                type="button"
                onClick={handleNext}
                disabled={!canProceed || submitting}
              >
                Continuar
              </Button>
            ) : (
              <Button
                type="button"
                onClick={finalizeOrder}
                disabled={items.length === 0 || submitting || (method === "card" && !canPayWithCard)}
              >
                <Lock className="w-4 h-4 mr-1" />
                {submitting ? "Processando..." : "Finalizar compra com seguranca"}
              </Button>
            )}
          </DialogFooter>
          <div className="rounded-lg border border-border/60 bg-secondary/20 px-3.5 py-3 text-xs grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-1">
            <p className="flex items-center gap-1 text-muted-foreground"><Lock className="w-3.5 h-3.5 text-primary" /> Compra 100% segura</p>
            <p className="flex items-center gap-1 text-muted-foreground"><CreditCard className="w-3.5 h-3.5 text-primary" /> Dados protegidos</p>
            <p className="flex items-center gap-1 text-muted-foreground"><Truck className="w-3.5 h-3.5 text-primary" /> Entrega garantida</p>
            <p className="flex items-center gap-1 text-muted-foreground"><Headset className="w-3.5 h-3.5 text-primary" /> Suporte rapido disponivel</p>
          </div>
        </form>
        <AnimatePresence>
          {submitting && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center rounded-lg"
            >
              <div className="text-center">
                {submitSuccess ? (
                  <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }}>
                    <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                    <p className="text-sm font-medium">Pedido finalizado com sucesso</p>
                  </motion.div>
                ) : (
                  <>
                    <motion.div
                      className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent mx-auto mb-2"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
                    />
                    <p className="text-sm text-muted-foreground">Finalizando seu pedido...</p>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default CheckoutModal;
