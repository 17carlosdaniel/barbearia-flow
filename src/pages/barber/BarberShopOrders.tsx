import { useEffect, useMemo, useRef, useState } from "react";
import { 
  History, 
  Menu, 
  Package, 
  Plus, 
  Minus, 
  Trash2, 
  Search, 
  ShoppingCart, 
  Flame, 
  AlertTriangle,
  User,
  DollarSign
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import {
  cancelOrder,
  createOrder,
  finalizeOrder,
  getOrdersByBarbershop,
  markOrderAsPaid,
  markOrderInService,
  getOrderDaySummary,
} from "@/lib/shopOrders";
import { getShopProductsByBarbershop } from "@/lib/shopProducts";
import type { ShopCartItem, ShopOrder, ShopProduct } from "@/types/shop";
import { toast } from "@/hooks/use-toast";
import { applySaleToInventory } from "@/lib/products";
import { generateItemPurchaseCode, generateOrderPublicCode } from "@/lib/orderCodes";

type FilterType = "todos" | "pendente" | "pago" | "finalizado";

const STATUS_META: Record<ShopOrder["status"], { label: string; className: string }> = {
  pendente: { label: "Pendente", className: "bg-amber-500/15 text-amber-300 border-amber-500/40" },
  pago: { label: "Pago", className: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40" },
  em_atendimento: { label: "Em atendimento", className: "bg-purple-500/15 text-purple-300 border-purple-500/40" },
  finalizado: { label: "Finalizado", className: "bg-blue-500/15 text-blue-300 border-blue-500/40" },
};

const PAYMENT_METHODS = [
  { id: "pix", label: "Pix" },
  { id: "card", label: "Cartão" },
  { id: "cash", label: "Dinheiro" },
] as const;

const formatCurrency = (value: number) =>
  value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

const BarberShopOrders = () => {
  const { user } = useAuth();
  const { identity } = useTheme();
  const isModern = identity === "modern";
  const barbershopId = user?.barbershopId ?? 1;
  const [orders, setOrders] = useState<ShopOrder[]>([]);
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Todos");
  const [cart, setCart] = useState<ShopCartItem[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<"pix" | "card" | "cash">("pix");
  const [customerName, setCustomerName] = useState("");
  const [filter, setFilter] = useState<FilterType>("todos");
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [cartPulse, setCartPulse] = useState(false);
  const prevCartCountRef = useRef(0);

  useEffect(() => {
    void reloadData();
  }, [barbershopId]);

  useEffect(() => {
    const prev = prevCartCountRef.current;
    const next = cart.length;
    if (next > prev) {
      setCartPulse(true);
      const id = window.setTimeout(() => setCartPulse(false), 380);
      prevCartCountRef.current = next;
      return () => window.clearTimeout(id);
    }
    prevCartCountRef.current = next;
  }, [cart.length]);

  const reloadData = async () => {
    const updated = await getOrdersByBarbershop(barbershopId);
    setOrders(updated);
    setProducts(getShopProductsByBarbershop(barbershopId));
  };

  const categories = useMemo(() => {
    const unique = new Set(products.map((item) => item.category || "Outros"));
    return ["Todos", ...Array.from(unique)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return products.filter((item) => {
      if (category !== "Todos" && item.category !== category) return false;
      if (!normalized) return true;
      return [item.name, item.description, item.category]
        .join(" ")
        .toLowerCase()
        .includes(normalized);
    });
  }, [products, search, category]);

  const cartSubtotal = useMemo(
    () => cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0),
    [cart],
  );

  const daySummary = useMemo(() => getOrderDaySummary(orders), [orders]);
  const topSellerProductId = useMemo(() => {
    const sorted = [...products].sort((a, b) => (b.soldCount ?? 0) - (a.soldCount ?? 0));
    return sorted[0]?.id;
  }, [products]);

  const visibleOrders = useMemo(() => {
    if (filter === "todos") return orders;
    if (filter === "pendente") return orders.filter((order) => order.status === "pendente");
    if (filter === "pago") return orders.filter((order) => order.status === "pago" || order.status === "em_atendimento");
    return orders.filter((order) => order.status === "finalizado");
  }, [orders, filter]);

  const addToCart = (product: ShopProduct) => {
    setCart((prev) => {
      const existing = prev.find((line) => line.product.id === product.id);
      if (existing) {
        const nextQuantity = Math.min(existing.quantity + 1, product.stock);
        return prev.map((line) => (line.product.id === product.id ? { ...line, quantity: nextQuantity } : line));
      }
      return [...prev, { id: String(product.id), product, quantity: 1 }];
    });
  };

  const updateCartQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((line) => {
          if (line.product.id !== productId) return line;
          return { ...line, quantity: line.quantity + delta };
        })
        .filter((line) => line.quantity > 0),
    );
  };

  const removeCartItem = (productId: string) => {
    setCart((prev) => prev.filter((line) => line.product.id !== productId));
  };
  const clearCart = () => setCart([]);

  const handleFinalizeSale = async () => {
    if (cart.length === 0) return;
    const now = new Date().toISOString();
    const client = customerName.trim() || "Cliente balcão";
    const itemsWithCodes = cart.map((line) => ({
      ...line,
      purchaseCode: line.purchaseCode ?? generateItemPurchaseCode(line.product.id),
    }));
    const newOrder: ShopOrder = {
      id: `PDV-${Date.now()}`,
      orderPublicCode: generateOrderPublicCode(),
      barbershopId,
      items: itemsWithCodes,
      subtotal: cartSubtotal,
      shipping: 0,
      total: cartSubtotal,
      customerName: client,
      customerPhone: "",
      paymentMethod: selectedPayment,
      status: selectedPayment === "pix" ? "pendente" : "pago",
      pickupInStore: true,
      pickupLocation: "Balcão da barbearia",
      createdAt: now,
      barberId: user?.id,
      barberName: user?.name,
      attendedAt: now,
    };
    const result = await createOrder(newOrder);
    applySaleToInventory(barbershopId, cart, `Venda PDV ${newOrder.id}`);
    if (!result.ok) {
      toast({
        title: "Venda registrada localmente",
        description: "Não foi possível enviar para o servidor agora.",
      });
    } else {
      toast({
        title: "Venda concluída",
        description: `Código ${newOrder.orderPublicCode}. Total ${formatCurrency(cartSubtotal)} em ${PAYMENT_METHODS.find((m) => m.id === selectedPayment)?.label}.`,
      });
    }
    setCart([]);
    setCustomerName("");
    await reloadData();
  };

  const handleMarkPaid = async (orderId: string) => {
    await markOrderAsPaid(orderId);
    await reloadData();
  };

  const handleMarkInService = async (orderId: string) => {
    await markOrderInService(orderId, user?.id, user?.name);
    await reloadData();
  };

  const handleFinalizeOrder = async (orderId: string) => {
    await finalizeOrder(orderId, user?.id, user?.name);
    await reloadData();
  };

  const handleCancelOrder = async (orderId: string) => {
    await cancelOrder(orderId);
    await reloadData();
  };

  const formatOrderDate = (value: string) => {
    const date = new Date(value);
    const today = new Date();
    const sameDay = date.toDateString() === today.toDateString();
    const hour = date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    if (sameDay) return `Hoje • ${hour}`;
    return `${date.toLocaleDateString("pt-BR")} • ${hour}`;
  };

  return (
    <DashboardLayout userType="barbeiro">
      <div className="space-y-8">
        {/* BLOCO 1 — CABEÇALHO OPERACIONAL */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <h1 className={cn(
              "text-3xl font-bold tracking-tight",
              isModern ? "font-display text-primary" : "font-vintage-display text-gradient-gold"
            )}>
              {isModern ? "Nova venda" : "Caixa do balcão"}
            </h1>
            <p className="text-sm text-muted-foreground max-w-xl">
              {isModern 
                ? "Selecione produtos e finalize o pagamento no caixa."
                : "Registre saídas da loja com rapidez, clareza e conferência imediata"
              }
            </p>
          </div>
          
          {/* MENU DE AÇÕES SECUNDÁRIAS - INTEGRADO */}
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setHistoryOpen(true)}
              className={cn(
                "gap-2 h-9",
                !isModern && "border-primary/20 bg-secondary/30 hover:bg-primary/10"
              )}
            >
              <History className="w-4 h-4" />
              Histórico
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className={cn(
                  "gap-2 h-9",
                  !isModern && "border-primary/20 bg-secondary/30 hover:bg-primary/10"
                )}>
                  <Menu className="w-4 h-4" />
                  Mais ações
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className={!isModern ? "bg-[hsl(30,12%,12%)] border-primary/20" : ""}>
                <DropdownMenuItem onClick={() => setFilter("todos")} className={!isModern ? "hover:bg-primary/10" : ""}>
                  <Package className="w-4 h-4 mr-2" />
                  {isModern ? "Pedidos" : "Pedidos"}
                </DropdownMenuItem>
                <DropdownMenuItem className={!isModern ? "hover:bg-primary/10" : ""}>
                  <DollarSign className="w-4 h-4 mr-2" />
                  {isModern ? "Caixa do dia" : "Movimento do dia"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* ÁREA PRINCIPAL - FLUXO INTEGRADO */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* BLOCO 2 — ITENS DISPONÍVEIS (8 colunas no desktop) */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">
            {/* BUSCA E FILTROS INTEGRADOS */}
            <div className={cn(
              "p-5 border space-y-5",
              isModern
                ? "rounded-2xl border-border/50 bg-card shadow-sm"
                : "rounded-2xl border-primary/20 bg-[hsl(28,10%,8%)]/60 backdrop-blur-sm",
            )}>
              <div className="flex flex-col sm:flex-row gap-4">
                {/* BUSCA FORTE VISUALMENTE */}
                <div className="flex-1 space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.15em] font-semibold text-muted-foreground/80 px-1">
                    {isModern ? "Pesquisar" : "Buscar item"}
                  </label>
                  <div className="relative group">
                    <Search className={cn(
                      "w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors",
                      isModern ? "text-primary/60 group-focus-within:text-primary" : "text-primary/50 group-focus-within:text-primary"
                    )} />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder={isModern ? "Buscar produto..." : "Qual item deseja incluir?"}
                      className={cn(
                        "w-full h-11 rounded-xl border pl-11 pr-4 text-sm font-medium outline-none transition-all",
                        isModern
                          ? "border-border/60 bg-background focus:ring-2 focus:ring-primary/20"
                          : "border-primary/20 bg-[hsl(30,10%,10%)] focus:border-primary/40 focus:ring-2 focus:ring-primary/10",
                      )}
                    />
                  </div>
                </div>

                {/* FILTRO DE CATEGORIA INTEGRADO */}
                <div className="sm:w-56 space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.15em] font-semibold text-muted-foreground/80 px-1">
                    Categoria
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className={cn(
                      "w-full h-11 rounded-xl border px-3 text-sm font-medium outline-none transition-all",
                      isModern 
                        ? "border-border/60 bg-background" 
                        : "border-primary/20 bg-[hsl(30,10%,10%)] focus:border-primary/40 focus:ring-2 focus:ring-primary/10",
                    )}
                  >
                    {categories.map((item) => (
                      <option key={item} value={item}>
                        {item === "Todos" ? "Todos os itens" : item}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* GRID DE PRODUTOS - CARDS REFINADOS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              <AnimatePresence mode="popLayout">
                {filteredProducts.map((product, index) => (
                  <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.2, delay: index * 0.02 }}
                    className={cn(
                      "group relative rounded-2xl border transition-all overflow-hidden flex flex-col",
                      isModern 
                        ? "border-border/50 bg-card hover:border-primary/30"
                        : "border-primary/10 bg-[hsl(30,12%,10%)] hover:border-primary/30 shadow-lg hover:shadow-primary/5"
                    )}
                  >
                    {/* IMAGEM E BADGES */}
                    <div className={cn("relative aspect-[4/3] flex items-center justify-center overflow-hidden",
                      isModern ? "bg-muted/30" : "bg-[hsl(30,10%,8%)]"
                    )}>
                      {product.image ? (
                        <img 
                          src={product.image} 
                          alt={product.name} 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                        />
                      ) : (
                        <Package className="w-10 h-10 text-muted-foreground/20" />
                      )}
                      
                      {/* PREÇO SOBREPOSTO - PREMIUM */}
                      <div className={cn(
                        "absolute top-3 left-3 px-2.5 py-1 rounded-lg text-[11px] font-black backdrop-blur-md border shadow-xl z-20",
                        isModern 
                          ? "bg-background/80 border-border/40 text-primary"
                          : "bg-black/85 border-primary/30 text-primary"
                      )}>
                        {formatCurrency(product.price)}
                      </div>

                      {product.id === topSellerProductId && (
                        <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider shadow-lg">
                          <Flame className="w-3 h-3" />
                          Top
                        </div>
                      )}
                    </div>
                    
                    <div className="p-4 flex flex-col flex-1 space-y-4">
                      <div className="space-y-1">
                        <p className="font-bold text-foreground leading-snug group-hover:text-primary transition-colors min-h-[2.5rem] line-clamp-2">
                          {product.name}
                        </p>
                        <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-[0.15em]">
                          {product.category || "Geral"}
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-between gap-2 mt-auto pt-1">
                        {/* ESTADO DE ESTOQUE - MAIS REFINADO E SEM QUEBRA */}
                        <div className={cn(
                          "flex items-center gap-1.5 px-2.5 h-8 rounded-lg text-[10px] font-bold whitespace-nowrap min-w-0 shrink-0",
                          product.stock <= 5 
                            ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" 
                            : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                        )}>
                          {product.stock <= 5 ? (
                            <span className="flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 shrink-0" />
                              Últimas
                            </span>
                          ) : (
                            "Em estoque"
                          )}
                          <span className="opacity-60 tabular-nums">({product.stock})</span>
                        </div>

                        {/* BOTÃO INCLUIR - AUTORAL E ALINHADO */}
                        <button
                          onClick={() => addToCart(product)}
                          className={cn(
                            "flex items-center justify-center gap-1.5 h-8 px-3 rounded-lg text-[10px] font-bold transition-all active:scale-95 shrink-0",
                            isModern
                              ? "bg-primary text-primary-foreground hover:bg-primary/90"
                              : "bg-primary text-primary-foreground hover:shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)]"
                          )}
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Incluir
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* BLOCO 3 & 4 — VENDA ATUAL E FECHAMENTO (4 colunas no desktop) */}
          <div className="lg:col-span-5 xl:col-span-4 sticky top-6">
            <div className={cn(
              "border flex flex-col min-h-[600px] transition-all duration-300",
              isModern
                ? cn("rounded-2xl border-border/50 bg-card shadow-sm", cartPulse && "scale-[1.01] border-primary/50")
                : cn(
                    "rounded-2xl border-primary/20 bg-[hsl(28,10%,10%)]/80 backdrop-blur-md shadow-2xl shadow-black/40",
                    cartPulse && "scale-[1.01] border-primary/40",
                  ),
            )}>
              {/* HEADER DA VENDA */}
              <div className="p-5 border-b border-primary/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center",
                    isModern ? "bg-primary/10 text-primary" : "bg-primary text-primary-foreground"
                  )}>
                    <ShoppingCart className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground">
                      {isModern ? "Carrinho" : "Venda atual"}
                    </h2>
                    {cart.length > 0 && (
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        {cart.length} {cart.length === 1 ? "item selecionado" : "itens selecionados"}
                      </p>
                    )}
                  </div>
                </div>
                {cart.length > 0 && (
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={clearCart} 
                    className="h-8 text-[11px] font-bold uppercase tracking-wider text-muted-foreground hover:text-destructive hover:bg-destructive/5"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                    Limpar
                  </Button>
                )}
              </div>

              {/* CONTEÚDO DA VENDA - FLUIDO */}
              <div className="flex-1 overflow-hidden flex flex-col">
                {cart.length === 0 ? (
                  /* ESTADO VAZIO GUIADO */
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
                    <div className={cn(
                      "w-20 h-20 rounded-full flex items-center justify-center border-2 border-dashed border-primary/20",
                      !isModern && "bg-primary/5"
                    )}>
                      <Package className="w-8 h-8 text-primary/30" />
                    </div>
                    <div className="space-y-2 max-w-[240px]">
                      <p className="text-foreground font-bold text-lg leading-tight">
                        {isModern ? "Nenhum item adicionado" : "Sua venda começa pelos itens"}
                      </p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {isModern 
                          ? "Selecione produtos à esquerda para iniciar a venda."
                          : "Selecione produtos do balcão para montar a saída da loja. O resumo aparecerá aqui."
                        }
                      </p>
                    </div>
                  </div>
                ) : (
                  /* LISTA DE ITENS REFINADA */
                  <div className="flex-1 overflow-y-auto p-5 space-y-4">
                    <AnimatePresence initial={false}>
                      {cart.map((line) => (
                        <motion.div
                          key={line.product.id}
                          layout
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          className={cn(
                            "group rounded-xl border p-3.5 transition-all",
                            isModern 
                              ? "border-border/50 bg-background hover:border-primary/30" 
                              : "border-primary/10 bg-primary/5 hover:border-primary/25",
                          )}
                        >
                          <div className="flex gap-3">
                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted/20 shrink-0">
                              {line.product.image ? (
                                <img src={line.product.image} alt={line.product.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Package className="w-5 h-5 text-muted-foreground/30" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start">
                                <p className="font-bold text-sm text-foreground truncate pr-2">{line.product.name}</p>
                                <button 
                                  onClick={() => removeCartItem(line.product.id)}
                                  className="text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <p className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wider mb-2">
                                {formatCurrency(line.product.price)} / un
                              </p>
                              
                              <div className="flex items-center justify-between">
                                <div className="flex items-center bg-background/40 rounded-lg border border-primary/10 p-1">
                                  <button 
                                    onClick={() => updateCartQuantity(line.product.id, -1)}
                                    className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-primary/10 text-primary transition-colors"
                                  >
                                    <Minus className="w-3.5 h-3.5" />
                                  </button>
                                  <span className="text-sm w-8 text-center font-bold tabular-nums">{line.quantity}</span>
                                  <button 
                                    onClick={() => updateCartQuantity(line.product.id, 1)}
                                    className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-primary/10 text-primary transition-colors"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                                <span className="font-bold text-foreground text-sm tabular-nums">
                                  {formatCurrency(line.product.price * line.quantity)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}

                {/* PAINEL DE FECHAMENTO - FIXO NO RODAPÉ DO CARD */}
                <div className={cn(
                  "p-5 border-t space-y-5 transition-all",
                  cart.length === 0 ? "opacity-40 grayscale pointer-events-none" : "bg-primary/[0.02]",
                  isModern ? "border-border/60" : "border-primary/10"
                )}>
                  {/* CLIENTE OPCIONAL */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-primary" />
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Cliente (opcional)
                      </label>
                    </div>
                    <input
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Adicione o nome para identificar esta venda"
                      className={cn(
                        "w-full h-10 rounded-xl border px-3 text-sm font-medium outline-none transition-all",
                        isModern 
                          ? "border-border/60 bg-background focus:ring-2 focus:ring-primary/20" 
                          : "border-primary/15 bg-primary/5 focus:border-primary/40 focus:bg-primary/10",
                      )}
                    />
                  </div>

                  {/* FORMA DE RECEBIMENTO */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-3.5 h-3.5 text-primary" />
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Forma de recebimento
                      </label>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {PAYMENT_METHODS.map((method) => (
                        <button
                          key={method.id}
                          type="button"
                          onClick={() => setSelectedPayment(method.id)}
                          className={cn(
                            "h-10 rounded-xl border text-[10px] font-bold uppercase tracking-[0.1em] transition-all",
                            selectedPayment === method.id
                              ? "border-primary bg-primary text-primary-foreground shadow-[0_0_15px_rgba(var(--primary-rgb),0.25)]"
                              : isModern
                                ? "border-border/60 bg-background text-foreground hover:border-primary/40"
                                : "border-primary/20 bg-primary/5 text-muted-foreground hover:border-primary/40 hover:text-foreground",
                          )}
                        >
                          {method.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* RESUMO FINANCEIRO */}
                  <div className={cn(
                    "rounded-2xl border p-4 space-y-3",
                    isModern ? "border-primary/20 bg-primary/5" : "border-primary/15 bg-primary/10"
                  )}>
                    <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
                      <span>Itens da venda</span>
                      <span className="tabular-nums">{formatCurrency(cartSubtotal)}</span>
                    </div>
                    <div className="h-px bg-primary/10" />
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-foreground">Fechamento</span>
                      <span className={cn(
                        "text-2xl font-black tabular-nums",
                        isModern ? "text-primary" : "text-primary"
                      )}>
                        {formatCurrency(cartSubtotal)}
                      </span>
                    </div>
                  </div>

                  {/* CTA FINAL */}
                  <Button
                    onClick={handleFinalizeSale}
                    className={cn(
                      "w-full h-14 text-sm font-black uppercase tracking-widest transition-all",
                      isModern ? "rounded-2xl" : "rounded-xl shadow-[0_10px_30px_-10px_rgba(var(--primary-rgb),0.5)]",
                      cart.length > 0 
                        ? "bg-primary text-primary-foreground hover:translate-y-[-2px] hover:shadow-primary/40"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {isModern ? "Finalizar recebimento" : "Registrar venda"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* DIALOG DE HISTÓRICO */}
        <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
          <DialogContent className="sm:max-w-4xl max-h-[85vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>{isModern ? "Histórico de vendas" : "Histórico de vendas"}</DialogTitle>
            </DialogHeader>
            <div className="flex flex-wrap gap-2 mb-4">
              {[
                { id: "todos", label: "Todos" },
                { id: "pendente", label: "Pendentes" },
                { id: "pago", label: "Pagos" },
                { id: "finalizado", label: "Finalizados" },
              ].map((item) => (
                <Button
                  key={item.id}
                  size="sm"
                  variant={filter === item.id ? "default" : "outline"}
                  onClick={() => setFilter(item.id as FilterType)}
                >
                  {item.label}
                </Button>
              ))}
            </div>
            {visibleOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                {isModern ? "Nenhuma venda para este filtro." : "Nenhuma venda para este filtro."}
              </p>
            ) : (
              <div className="space-y-3">
                {visibleOrders.map((order) => {
                  const totalItems = order.items.reduce((acc, item) => acc + item.quantity, 0);
                  const isExpanded = expandedOrderId === order.id;
                  return (
                    <div key={order.id} className={cn(
                      "rounded-xl border p-4 space-y-3",
                      isModern ? "border-border/60 bg-card" : "border-border/60 bg-card"
                    )}>
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-foreground">Venda #{String(order.id).slice(-4)}</p>
                          {order.orderPublicCode && (
                            <p className="text-[11px] text-primary">Código: {order.orderPublicCode}</p>
                          )}
                          <p className="text-xs text-muted-foreground">{order.customerName}</p>
                          <p className="text-xs text-muted-foreground">
                            {totalItems} item(s) • {formatCurrency(order.total)}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex items-center rounded-full border px-2 py-1 text-xs ${STATUS_META[order.status].className}`}>
                            {STATUS_META[order.status].label}
                          </span>
                          <p className="text-xs text-muted-foreground mt-1">{formatOrderDate(order.createdAt)}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleMarkPaid(order.id)}>
                          Marcar pago
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleMarkInService(order.id)}>
                          Em atendimento
                        </Button>
                        <Button size="sm" onClick={() => handleFinalizeOrder(order.id)}>
                          Finalizar
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleCancelOrder(order.id)}>
                          Cancelar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setExpandedOrderId((prev) => (prev === order.id ? null : order.id))}
                        >
                          {isExpanded ? "Ocultar" : "Detalhes"}
                        </Button>
                      </div>

                      {isExpanded && (
                        <div className="rounded-lg border border-border/60 bg-muted/50 p-3 space-y-2">
                          <p className="text-sm font-medium text-foreground">Itens</p>
                          <div className="space-y-1">
                            {order.items.map((item) => (
                              <p key={`${order.id}-${item.product.id}`} className="text-xs text-muted-foreground">
                                - {item.product.name} ({formatCurrency(item.product.price)}) x{item.quantity}
                              </p>
                            ))}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Pagamento: {PAYMENT_METHODS.find((m) => m.id === order.paymentMethod)?.label ?? order.paymentMethod}
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <User className="w-3 h-3" /> Atendido por: {order.barberName ?? "Não informado"}
                          </p>
                          <div className="space-y-1 pt-1">
                            {order.items.map((item) => (
                              <p key={`${order.id}-${item.product.id}-code`} className="text-[11px] text-primary/90">
                                Código {item.product.name}: {item.purchaseCode ?? "não gerado"} · Qtd: {item.quantity}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default BarberShopOrders;
