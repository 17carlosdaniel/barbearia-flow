import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { 
  CreditCard, 
  Trash2, 
  Star, 
  Plus, 
  ShieldCheck, 
  Lock, 
  Sparkles, 
  PencilLine, 
  CheckCircle2, 
  ChevronRight,
  AlertCircle
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import {
  addSavedPaymentCard,
  detectCardBrand,
  formatCardNumber,
  formatExpiry,
  isExpiryValid,
  loadSavedPaymentCards,
  removeSavedPaymentCard,
  SavedPaymentCard,
  setDefaultSavedPaymentCard,
  updateSavedPaymentCard,
} from "@/lib/paymentCards";

const ClientPaymentCards = () => {
  const { user } = useAuth();
  const { identity } = useTheme();
  const isVintage = identity === "vintage";
  
  const [holder, setHolder] = useState("");
  const [number, setNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [editingHolder, setEditingHolder] = useState("");
  const [editingExpiry, setEditingExpiry] = useState("");
  const [cards, setCards] = useState<SavedPaymentCard[]>([]);
  const [recentSuccess, setRecentSuccess] = useState<"saved" | "updated" | "removed" | null>(null);

  useEffect(() => {
    setCards(loadSavedPaymentCards(user?.id));
  }, [user?.id]);

  const cardDigits = useMemo(() => number.replace(/\D/g, ""), [number]);
  const cardBrand = useMemo(() => detectCardBrand(cardDigits), [cardDigits]);
  const canSaveCard = Boolean(holder.trim()) && cardDigits.length >= 13 && cardDigits.length <= 16 && isExpiryValid(expiry);

  const handleAddCard = () => {
    if (!holder.trim()) {
      toast({ title: "Nome do titular obrigatório", variant: "destructive" });
      return;
    }
    if (cardDigits.length < 13 || cardDigits.length > 16) {
      toast({ title: "Número do cartão inválido", description: "Use entre 13 e 16 dígitos.", variant: "destructive" });
      return;
    }
    if (!isExpiryValid(expiry)) {
      toast({ title: "Validade inválida", description: "Informe uma validade futura no formato MM/AA.", variant: "destructive" });
      return;
    }
    const next = addSavedPaymentCard(user?.id, { holder, digits: cardDigits, expiry });
    setCards(next);
    setHolder("");
    setNumber("");
    setExpiry("");
    setRecentSuccess("saved");
    toast({ title: "Cartão salvo com sucesso" });
    window.setTimeout(() => setRecentSuccess(null), 1200);
  };

  const setDefault = (id: string) => {
    const next = setDefaultSavedPaymentCard(user?.id, id);
    setCards(next);
    toast({ title: "Cartão padrão atualizado" });
  };

  const removeCard = (id: string) => {
    const next = removeSavedPaymentCard(user?.id, id);
    setCards(next);
    setRecentSuccess("removed");
    toast({ title: "Cartão removido" });
    window.setTimeout(() => setRecentSuccess(null), 1200);
  };

  const startEditing = (card: SavedPaymentCard) => {
    setEditingCardId(card.id);
    setEditingHolder(card.holder);
    setEditingExpiry(card.expiry);
  };

  const cancelEditing = () => {
    setEditingCardId(null);
    setEditingHolder("");
    setEditingExpiry("");
  };

  const saveEdit = () => {
    if (!editingCardId) return;
    if (!editingHolder.trim()) {
      toast({ title: "Nome do titular obrigatório", variant: "destructive" });
      return;
    }
    if (!isExpiryValid(editingExpiry)) {
      toast({ title: "Validade inválida", variant: "destructive" });
      return;
    }
    const next = updateSavedPaymentCard(user?.id, editingCardId, {
      holder: editingHolder,
      expiry: editingExpiry,
    });
    setCards(next);
    setRecentSuccess("updated");
    toast({ title: "Cartão atualizado" });
    cancelEditing();
    window.setTimeout(() => setRecentSuccess(null), 1200);
  };

  return (
    <DashboardLayout userType="cliente">
      <div className={cn("mx-auto transition-all duration-500", isVintage ? "max-w-4xl" : "max-w-5xl")}>
        {isVintage ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10 pb-20">
            {/* VINTAGE: HEADER PREMIUM */}
            <header className="space-y-4">
              <div className="flex flex-col gap-2">
                <h1 className="text-4xl font-display font-bold text-foreground tracking-tighter">Seus cartões</h1>
                <p className="text-muted-foreground font-medium text-lg leading-relaxed max-w-xl opacity-80">
                  Guarde um cartão para concluir compras com mais agilidade na sua jornada BarberFlow.
                </p>
              </div>
              <div className="flex items-center gap-2 text-primary/70 text-sm font-black uppercase tracking-widest mt-6">
                <ShieldCheck className="w-5 h-5" />
                <span>Ambiente protegido para pagamentos</span>
              </div>
            </header>

            {/* VINTAGE: NOVO CARTÃO (UNIFICADO) */}
            <section className="bg-card/40 backdrop-blur-sm rounded-[2.5rem] border border-primary/5 p-8 sm:p-12 shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-primary/10 transition-colors duration-700" />
              
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 relative z-10">
                <div className="lg:col-span-7 space-y-8">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-bold text-foreground tracking-tight">Novo método</h2>
                    <p className="text-sm text-muted-foreground opacity-60">Preencha os dados originais do seu cartão físico</p>
                  </div>

                  <form className="space-y-6">
                    <div className="space-y-2">
                      <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/80 ml-1">Titular do Cartão</Label>
                      <Input
                        value={holder}
                        onChange={(e) => setHolder(e.target.value)}
                        placeholder="Nome como impresso"
                        className="bg-transparent border-t-0 border-x-0 border-b border-border/60 focus:border-primary rounded-none px-1 h-12 text-lg font-medium transition-all"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/80 ml-1">Número</Label>
                      <div className="relative">
                        <Input
                          value={number}
                          onChange={(e) => setNumber(formatCardNumber(e.target.value))}
                          placeholder="0000 0000 0000 0000"
                          inputMode="numeric"
                          className="bg-transparent border-t-0 border-x-0 border-b border-border/60 focus:border-primary rounded-none px-1 h-12 text-lg font-medium transition-all"
                        />
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 text-xs font-black uppercase tracking-widest text-primary/40">
                          {cardBrand}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/80 ml-1">Validade (MM/AA)</Label>
                        <Input
                          value={expiry}
                          onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                          placeholder="MM/AA"
                          inputMode="numeric"
                          className="bg-transparent border-t-0 border-x-0 border-b border-border/60 focus:border-primary rounded-none px-1 h-12 text-lg font-medium transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/80 ml-1">Status</Label>
                        <div className="h-12 flex items-center">
                          {canSaveCard ? (
                            <div className="flex items-center gap-2 text-emerald-500 font-bold text-xs uppercase tracking-wider animate-in fade-in slide-in-from-left-2">
                              <CheckCircle2 className="w-4 h-4" />
                              Cartão válido
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-muted-foreground/40 font-medium text-xs italic">
                              Aguardando dados...
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <Button
                      type="button"
                      onClick={handleAddCard}
                      disabled={!canSaveCard}
                      className="w-full sm:w-auto h-14 px-10 rounded-2xl bg-primary text-primary-foreground font-black uppercase tracking-widest text-xs shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all active:scale-95 disabled:opacity-30"
                    >
                      <Plus className="w-4 h-4 mr-2 stroke-[3]" />
                      Guardar para próximas compras
                    </Button>
                  </form>
                </div>

                {/* VINTAGE: PREVIEW INTEGRADO */}
                <div className="lg:col-span-5 flex flex-col justify-center gap-8 border-l border-primary/5 pl-0 lg:pl-12">
                  <div className="relative group">
                    <div className="absolute -inset-8 bg-primary/5 rounded-[3rem] blur-3xl group-hover:bg-primary/10 transition-all duration-700" />
                    <motion.div
                      layout
                      className="relative aspect-[1.58/1] w-full max-w-[360px] mx-auto rounded-[1.25rem] border border-primary/20 bg-gradient-to-br from-zinc-900 via-black to-zinc-900 p-6 flex flex-col justify-between shadow-2xl overflow-hidden group/card transition-transform duration-500 hover:rotate-1 hover:scale-[1.02]"
                    >
                      {/* Efeito de brilho no cartão */}
                      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-1000 -translate-x-[100%] group-hover/card:translate-x-[100%]" />
                      
                      <div className="flex items-start justify-between relative z-10">
                        <div className="flex flex-col gap-3">
                          <span className="text-[10px] text-primary/60 font-black uppercase tracking-[0.2em] inline-flex items-center gap-1.5">
                            <Sparkles className="w-3 h-3" />
                            Fast Pass
                          </span>
                          {/* Chip Realista */}
                          <div className="w-10 h-8 rounded-md bg-gradient-to-br from-primary/40 via-primary/20 to-primary/60 border border-primary/30 relative overflow-hidden flex items-center justify-center">
                            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-[1px] opacity-30">
                              {[...Array(9)].map((_, i) => (
                                <div key={i} className="border-[0.5px] border-black/20" />
                              ))}
                            </div>
                            <div className="w-1/2 h-4 rounded-sm border border-black/10" />
                          </div>
                        </div>
                        <CreditCard className="w-7 h-7 text-primary/40" />
                      </div>
                      
                      <div className="space-y-4 relative z-10">
                        <p className="text-xl sm:text-2xl tracking-[0.2em] text-white font-mono font-bold drop-shadow-lg">
                          {cardDigits
                            ? formatCardNumber(cardDigits).padEnd(19, "*").slice(0, 19)
                            : "**** **** **** ****"}
                        </p>
                        
                        <div className="flex justify-between items-end">
                          <div className="space-y-1">
                            <p className="text-[9px] text-white/40 font-black uppercase tracking-widest">Titular</p>
                            <p className="text-sm text-white/90 font-bold truncate max-w-[180px] uppercase tracking-widest italic">{holder || "Barber Guest"}</p>
                          </div>
                          <div className="text-right space-y-1">
                            <p className="text-[9px] text-white/40 font-black uppercase tracking-widest">Expira</p>
                            <p className="text-sm text-white/90 font-bold tracking-[0.2em]">{expiry || "MM/AA"}</p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3 p-4 rounded-2xl bg-primary/[0.03] border border-primary/5">
                      <Lock className="w-4 h-4 text-primary mt-0.5" />
                      <p className="text-xs text-muted-foreground leading-relaxed italic">
                        Ambiente BarberFlow Protegido. Seus dados de pagamento são processados sob tokens de segurança de alta performance.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* VINTAGE: LISTA ANALÓGICA */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-foreground">Seus métodos</h2>
                <div className="h-px bg-primary/10 flex-1 ml-6" />
              </div>
              
              {cards.length === 0 ? (
                <div className="rounded-[2rem] border border-dashed border-primary/10 p-12 text-center space-y-4 bg-primary/[0.01]">
                  <div className="w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center mx-auto mb-4">
                    <CreditCard className="w-8 h-8 text-primary/20" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground opacity-60">Você ainda não guardou nenhum cartão</h3>
                  <p className="text-sm text-muted-foreground max-w-xs mx-auto italic">Adicione seu primeiro cartão acima para acelerar seus próximos agendamentos.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <AnimatePresence initial={false}>
                    {cards.map((card, index) => (
                      <motion.div
                        key={card.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="rounded-[2rem] border border-primary/5 bg-card/60 p-6 space-y-6 shadow-sm hover:shadow-md transition-shadow group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-primary/5 text-primary flex items-center justify-center border border-primary/10 transition-transform group-hover:rotate-6">
                            <CreditCard className="w-6 h-6" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-base font-bold text-foreground">
                              {card.brand} •••• {card.last4}
                            </p>
                            <p className="text-xs text-muted-foreground opacity-60 uppercase font-black tracking-widest mt-0.5">
                              Expira em {card.expiry}
                            </p>
                          </div>
                          {card.isDefault && (
                            <span className="text-[10px] px-3 py-1 rounded-full bg-primary text-primary-foreground font-black uppercase tracking-widest shadow-lg shadow-primary/20">
                              Favorito
                            </span>
                          )}
                        </div>

                        {editingCardId === card.id ? (
                          <div className="space-y-4 pt-4 border-t border-primary/5">
                            <Input
                              value={editingHolder}
                              onChange={(e) => setEditingHolder(e.target.value)}
                              placeholder="Titular"
                              className="bg-muted/40 border-primary/10 h-10 px-4 rounded-xl"
                            />
                            <div className="flex gap-2">
                              <Button size="sm" onClick={saveEdit} className="rounded-xl px-4 h-9">
                                Confirmar
                              </Button>
                              <Button size="sm" variant="ghost" onClick={cancelEditing} className="rounded-xl px-4 h-9">
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-2 pt-2">
                            {!card.isDefault && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDefault(card.id)}
                                className="rounded-xl h-10 text-xs font-bold bg-primary/5 hover:bg-primary/10 hover:text-primary"
                              >
                                Usar como padrão
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => startEditing(card)}
                              className="rounded-xl h-10 text-xs font-bold hover:bg-muted/80"
                            >
                              Editar
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeCard(card.id)}
                              className="rounded-xl h-10 text-xs font-bold text-destructive hover:bg-destructive/10"
                            >
                              Remover
                            </Button>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 pb-20">
            {/* MODERN: CABEÇALHO OBJETIVO */}
            <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border pb-8">
              <div className="space-y-1">
                <h1 className="text-3xl font-display font-bold text-foreground tracking-tight">Cartões salvos</h1>
                <p className="text-muted-foreground font-medium">Adicione um cartão para pagar com mais rapidez e agilidade.</p>
              </div>
              <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-600 px-4 py-2 rounded-xl border border-emerald-500/20 text-xs font-bold">
                <ShieldCheck className="w-4 h-4" />
                Pagamento protegido
              </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* MODERN: FORMULÁRIO COMPACTO */}
              <div className="lg:col-span-12">
                <section className="bg-card border border-border/80 rounded-[2rem] p-8 sm:p-10 shadow-sm">
                  <div className="flex flex-col lg:flex-row gap-10">
                    <div className="flex-1 space-y-6">
                      <div className="flex items-center gap-3 mb-2">
                        <CreditCard className="w-5 h-5 text-primary" />
                        <h2 className="text-lg font-bold">Novo Cartão</h2>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="space-y-2 lg:col-span-2">
                          <Label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Titular</Label>
                          <Input
                            value={holder}
                            onChange={(e) => setHolder(e.target.value)}
                            placeholder="NOME COMPLETO"
                            className="bg-muted/30 border-border/60 h-12 rounded-xl text-base px-4 uppercase focus:ring-primary/20"
                          />
                        </div>
                        <div className="space-y-2 lg:col-span-1">
                          <Label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Número</Label>
                          <div className="relative">
                            <Input
                              value={number}
                              onChange={(e) => setNumber(formatCardNumber(e.target.value))}
                              placeholder="0000 0000 0000 0000"
                              inputMode="numeric"
                              className="bg-muted/30 border-border/60 h-12 rounded-xl text-base px-4 focus:ring-primary/20"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase text-primary">
                              {cardBrand}
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2 lg:col-span-1">
                          <Label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Vencimento</Label>
                          <Input
                            value={expiry}
                            onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                            placeholder="MM/AA"
                            inputMode="numeric"
                            className="bg-muted/30 border-border/60 h-12 rounded-xl text-base px-4 focus:ring-primary/20"
                          />
                        </div>
                        <div className="space-y-2 lg:col-span-2 flex items-end">
                          <Button
                            type="button"
                            onClick={handleAddCard}
                            disabled={!canSaveCard}
                            className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold shadow-md hover:translate-y-[-1px] transition-all"
                          >
                            <Plus className="w-5 h-5 mr-2" />
                            Salvar cartão
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* MODERN: PREVIEW FUNCIONAL */}
                    <div className="lg:w-80 shrink-0">
                      <div className="rounded-2xl border border-border bg-muted/20 p-6 space-y-6 relative overflow-hidden h-full flex flex-col justify-center">
                        <div className="absolute top-2 right-4 flex gap-1 opacity-20">
                          <div className="w-8 h-8 rounded-full bg-foreground/20" />
                          <div className="w-8 h-8 rounded-full bg-foreground/10 -ml-4" />
                        </div>
                        
                        <div className="space-y-2">
                           <p className="text-xs font-bold text-muted-foreground tracking-widest uppercase">Número</p>
                           <p className="text-lg font-mono font-bold tracking-tight text-foreground">
                             {number || "•••• •••• •••• ••••"}
                           </p>
                        </div>

                        <div className="flex justify-between items-end">
                          <div className="space-y-1">
                            <p className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">Titular</p>
                            <p className="text-sm font-bold truncate max-w-[150px] uppercase">{holder || "---"}</p>
                          </div>
                          <div className="text-right space-y-1">
                            <p className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">Validade</p>
                            <p className="text-sm font-bold">{expiry || "--/--"}</p>
                          </div>
                        </div>

                        {!canSaveCard && (
                          <div className="flex items-center gap-2 text-[10px] font-bold text-primary/60 uppercase">
                             <AlertCircle className="w-3.5 h-3.5" />
                             Aguardando dados válidos
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              {/* MODERN: LISTA OPERACIONAL */}
              <div className="lg:col-span-12 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold">Meus Cartões</h2>
                  {cards.length > 0 && (
                    <span className="text-xs font-bold text-muted-foreground bg-muted px-3 py-1 rounded-full uppercase tracking-widest">
                      {cards.length} {cards.length === 1 ? 'Cadastrado' : 'Cadastrados'}
                    </span>
                  )}
                </div>

                {cards.length === 0 ? (
                  <div className="rounded-[2rem] border border-border p-12 text-center bg-muted/10">
                    <p className="text-lg font-bold text-foreground">Nenhum cartão cadastrado</p>
                    <p className="text-sm text-muted-foreground mt-2">Salve seus métodos de pagamento para pagar em segundos.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cards.map((card) => (
                      <motion.div
                        key={card.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl bg-card border border-border hover:border-primary/20 transition-all gap-4 group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary/5 group-hover:text-primary transition-colors">
                            <CreditCard className="w-6 h-6" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-foreground capitalize">
                                {card.brand} •••• {card.last4}
                              </p>
                              {card.isDefault && (
                                <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">
                                  Padrão
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground font-medium mt-0.5 uppercase tracking-tight">
                              {card.holder} • Expira {card.expiry}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 sm:self-center">
                          {!card.isDefault && (
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => setDefault(card.id)}
                                className="rounded-xl h-10 px-4 text-xs font-bold border-border/60 hover:border-primary"
                            >
                                Definir padrão
                            </Button>
                          )}
                          <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => startEditing(card)}
                              className="rounded-xl h-10 w-10 p-0"
                          >
                              <PencilLine className="w-4 h-4" />
                          </Button>
                          <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => removeCard(card.id)}
                              className="rounded-xl h-10 w-10 p-0 text-destructive hover:bg-destructive/10"
                          >
                              <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {recentSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-8 right-8 z-[100] rounded-2xl bg-emerald-500 text-white px-6 py-4 shadow-2xl flex items-center gap-3 font-bold"
          >
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
               <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm">Sucesso</span>
              <span className="text-xs opacity-80 font-medium">
                {recentSuccess === "saved" && "Cartão salvo com sucesso"}
                {recentSuccess === "updated" && "Cartão atualizado com sucesso"}
                {recentSuccess === "removed" && "Cartão removido"}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
};

export default ClientPaymentCards;
