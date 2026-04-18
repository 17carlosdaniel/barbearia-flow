import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Scissors,
  Trash2,
  Pencil,
  Camera,
  ImageIcon,
  Package,
  Clock,
  Sparkles,
  Star,
  TrendingUp,
  Copy,
  Calendar,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Users,
  Tag,
  Eye,
  ToggleLeft,
  ToggleRight,
  MoreVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import {
  getBarberCatalog,
  setBarberCatalog,
  SERVICE_CATEGORIES,
  DEFAULT_DURATION_BY_CATEGORY,
  type BarberPackage,
} from "@/lib/barberCatalog";
import { useToast } from "@/hooks/use-toast";
import { getTeam } from "@/lib/team";
import { getShopProductsByBarbershop } from "@/lib/shopProducts";
import { cn } from "@/lib/utils";

interface HaircutStyle {
  id: number;
  name: string;
  type: string;
  description: string;
  price: string;
  durationMinutes: number;
  photoUrl: string;
  active?: boolean;
  promoted?: boolean;
  assignedMemberIds?: string[];
}

type PackageTag = "Mais vendido" | "Premium" | "Promocao";

const BarberServices = () => {
  const { user } = useAuth();
  const { identity } = useTheme();
  const isModern = identity === "modern";
  const barbershopId = user?.barbershopId ?? 1;
  const { toast } = useToast();

  const [styles, setStyles] = useState<HaircutStyle[]>([
    { id: 1, name: "Corte Degradê", type: "Corte masculino", description: "Corte moderno com degradê nas laterais e nuca.", price: "45", durationMinutes: 30, photoUrl: "", active: true },
    { id: 2, name: "Barba Completa", type: "Barba", description: "Aparar, modelar e finalizar a barba.", price: "30", durationMinutes: 20, photoUrl: "", active: true },
    { id: 3, name: "Corte + Barba", type: "Corte + Barba", description: "Corte de cabelo e barba completa.", price: "65", durationMinutes: 50, photoUrl: "", active: true },
  ]);
  const categoryOptions = Array.from(
    new Set([
      ...SERVICE_CATEGORIES,
      ...styles.map((item) => item.type),
    ].filter(Boolean)),
  );
  const [showForm, setShowForm] = useState(false);
  const [editingStyleId, setEditingStyleId] = useState<number | null>(null);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newDuration, setNewDuration] = useState(30);
  const [newPhotoUrl, setNewPhotoUrl] = useState("");
  const [newActive, setNewActive] = useState(true);
  const [formStep, setFormStep] = useState<1 | 2 | 3>(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [categoryFilter, setCategoryFilter] = useState<string>("Todos");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAllFilters, setShowAllFilters] = useState(false);
  const [sortBy, setSortBy] = useState<"house" | "popular" | "revenue" | "price_high" | "fast" | "recent" | "low">("popular");

  const [packages, setPackages] = useState<BarberPackage[]>([]);
  const [showPackageForm, setShowPackageForm] = useState(false);
  const [activeTab, setActiveTab] = useState<"services" | "packages">("services");
  const [tabDirection, setTabDirection] = useState<1 | -1>(1);
  const [pkgName, setPkgName] = useState("");
  const [pkgDescription, setPkgDescription] = useState("");
  const [pkgBasePrice, setPkgBasePrice] = useState("0");
  const [pkgFinalPrice, setPkgFinalPrice] = useState("");
  const [pkgDiscountType, setPkgDiscountType] = useState<"percentual" | "fixo">("percentual");
  const [pkgDiscountValue, setPkgDiscountValue] = useState("10");
  const [pkgValidUntil, setPkgValidUntil] = useState("");
  const [pkgUsageType, setPkgUsageType] = useState<"single" | "multiple">("single");
  const [pkgTags, setPkgTags] = useState<PackageTag[]>([]);
  const [pkgServiceIds, setPkgServiceIds] = useState<string[]>([]);
  const [pkgProductIds, setPkgProductIds] = useState<string[]>([]);
  const [pkgImageUrl, setPkgImageUrl] = useState("");
  const [packageStep, setPackageStep] = useState<1 | 2 | 3 | 4>(1);
  const [packageServiceQuery, setPackageServiceQuery] = useState("");
  const [packageProductQuery, setPackageProductQuery] = useState("");
  const [editingPackageId, setEditingPackageId] = useState<string | null>(null);

  useEffect(() => {
    const catalog = getBarberCatalog(barbershopId);
    if (catalog.services.length > 0) {
      setStyles(catalog.services.map((s, i) => ({
        id: i + 1,
        name: s.name,
        type: s.category,
        description: s.description,
        price: String(s.price),
        durationMinutes: s.durationMinutes,
        photoUrl: s.photoUrl ?? "",
        active: true,
        promoted: false,
        assignedMemberIds: [],
      })));
    }
    setPackages(catalog.packages);
    if (catalog.services.length === 0 && styles.length > 0) {
      const nextCatalog = getBarberCatalog(barbershopId);
      nextCatalog.services = styles.map((s) => ({
        id: `s${s.id}`,
        barbershopId,
        name: s.name,
        category: s.type,
        price: parseFloat(s.price) || 0,
        durationMinutes: s.durationMinutes,
        description: s.description,
        photoUrl: s.photoUrl,
      }));
      setBarberCatalog(barbershopId, nextCatalog);
    }
  }, [barbershopId]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setNewPhotoUrl(url);
    }
  };

  const resetForm = () => {
    setNewName("");
    setNewType("");
    setNewDescription("");
    setNewPrice("");
    setNewDuration(30);
    setNewPhotoUrl("");
    setNewActive(true);
    setFormStep(1);
    setEditingStyleId(null);
    setShowForm(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const openEditForm = (style: HaircutStyle) => {
    setEditingStyleId(style.id);
    setNewName(style.name);
    setNewType(style.type);
    setNewDescription(style.description);
    setNewPrice(style.price);
    setNewDuration(style.durationMinutes);
    setNewPhotoUrl(style.photoUrl);
    setNewActive(style.active !== false);
    setFormStep(1);
    setShowForm(true);
  };

  const duplicateStyle = (style: HaircutStyle) => {
    const duplicated: HaircutStyle = {
      ...style,
      id: Date.now(),
      name: `${style.name} (cópia)`,
      active: true,
    };
    const next = [duplicated, ...styles];
    setStyles(next);
    syncCatalog(next, packages);
    toast({ title: "Serviço duplicado", description: "Edite o novo serviço para ajustar os detalhes." });
  };

  const toggleStyleActive = (id: number) => {
    const next = styles.map((s) => (s.id === id ? { ...s, active: s.active === false ? true : false } : s));
    setStyles(next);
    syncCatalog(next, packages);
  };

  const toggleStylePromoted = (id: number) => {
    const next = styles.map((s) => (s.id === id ? { ...s, promoted: !s.promoted } : s));
    setStyles(next);
    syncCatalog(next, packages);
  };

  const generateDescription = () => {
    if (!newName.trim()) return;
    const base = `${newName} com acabamento profissional`;
    const cat = newType || "serviço";
    const smart = cat.toLowerCase().includes("barba")
      ? `${base}, alinhamento preciso e finalização hidratante para barba.`
      : `${base}, transição suave e finalização na navalha para resultado moderno.`;
    setNewDescription(smart);
  };

  const openCreatePromotionForService = () => {
    toast({
      title: "Atalho para promoções",
      description: "Acesse Promoções para criar uma oferta vinculada a este serviço.",
    });
  };

  const addStyle = () => {
    if (!newName || !newPrice) return;
    const newStyle: HaircutStyle = {
      id: Date.now(),
      name: newName,
      type: newType || "Outro",
      description: newDescription,
      price: newPrice,
      durationMinutes: newDuration,
      photoUrl: newPhotoUrl,
      active: newActive,
    };
    const next = [...styles, newStyle];
    setStyles(next);
    resetForm();
    syncCatalog(next, packages);
    toast({
      title: "Serviço adicionado",
      description: "O serviço foi salvo com sucesso.",
    });
  };

  const updateStyle = () => {
    if (editingStyleId == null || !newName || !newPrice) return;
    const existing = styles.find((s) => s.id === editingStyleId);
    if (!existing) return;
    const updated: HaircutStyle = {
      ...existing,
      name: newName,
      type: newType || "Outro",
      description: newDescription,
      price: newPrice,
      durationMinutes: newDuration,
      photoUrl: newPhotoUrl,
      active: newActive,
    };
    const next = styles.map((s) => (s.id === editingStyleId ? updated : s));
    setStyles(next);
    resetForm();
    syncCatalog(next, packages);
    toast({
      title: "Serviço atualizado",
      description: "As alterações foram salvas.",
    });
  };

  const removeStyle = (id: number) => {
    const style = styles.find((s) => s.id === id);
    if (style?.photoUrl) URL.revokeObjectURL(style.photoUrl);
    const next = styles.filter((s) => s.id !== id);
    setStyles(next);
    syncCatalog(next, packages);
    toast({
      title: "Serviço removido",
      description: "O serviço foi excluído do catálogo.",
      variant: "destructive",
    });
  };

  function syncCatalog(serviceList: HaircutStyle[], pkgList: typeof packages) {
    const catalog = getBarberCatalog(barbershopId);
    catalog.services = serviceList.map((s) => ({
      id: `s${s.id}`,
      barbershopId,
      name: s.name,
      category: s.type,
      price: parseFloat(s.price) || 0,
      durationMinutes: s.durationMinutes,
      description: s.description,
      photoUrl: s.photoUrl,
    }));
    catalog.packages = pkgList.map((p) => ({ ...p, barbershopId }));
    setBarberCatalog(barbershopId, catalog);
  }

  const shopProducts = getShopProductsByBarbershop(barbershopId);
  const packageServiceOptions = styles.map((s) => ({ id: `s${s.id}`, name: s.name, price: Number(s.price || 0) }));
  const packageProductOptions = shopProducts.map((p) => ({ id: p.id, name: p.name, price: Number(p.price || 0) }));
  const selectedServicesTotal = packageServiceOptions
    .filter((item) => pkgServiceIds.includes(item.id))
    .reduce((acc, item) => acc + item.price, 0);
  const selectedProductsTotal = packageProductOptions
    .filter((item) => pkgProductIds.includes(item.id))
    .reduce((acc, item) => acc + item.price, 0);
  const packageBaseValue = Number((selectedServicesTotal + selectedProductsTotal).toFixed(2));
  const packageDiscountNumeric = Number(pkgDiscountValue || 0);
  const packageCalculatedFinal =
    pkgDiscountType === "fixo"
      ? Math.max(0, packageBaseValue - packageDiscountNumeric)
      : Math.max(0, packageBaseValue - (packageBaseValue * packageDiscountNumeric) / 100);
  const packageFinalValue = Number((pkgFinalPrice ? Number(pkgFinalPrice) : packageCalculatedFinal).toFixed(2));
  const packageSavingsValue = Math.max(0, Number((packageBaseValue - packageFinalValue).toFixed(2)));
  const packageDiscountPercent = packageBaseValue > 0 ? Math.round((packageSavingsValue / packageBaseValue) * 100) : 0;

  useEffect(() => {
    setPkgBasePrice(packageBaseValue.toFixed(2));
    if (!pkgFinalPrice) {
      setPkgFinalPrice(packageCalculatedFinal.toFixed(2));
    }
  }, [packageBaseValue, packageCalculatedFinal, pkgFinalPrice]);

  const resetPackageForm = () => {
    setPkgName("");
    setPkgDescription("");
    setPkgBasePrice("0");
    setPkgFinalPrice("");
    setPkgDiscountType("percentual");
    setPkgDiscountValue("10");
    setPkgValidUntil("");
    setPkgUsageType("single");
    setPkgTags([]);
    setPkgServiceIds([]);
    setPkgProductIds([]);
    setPkgImageUrl("");
    setPackageStep(1);
    setPackageServiceQuery("");
    setPackageProductQuery("");
  };

  const handlePackageImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setPkgImageUrl(url);
    }
  };

  const addPackage = () => {
    if (!pkgName || (pkgServiceIds.length === 0 && pkgProductIds.length === 0) || packageFinalValue <= 0) return;
    const newPkg: BarberPackage = {
      id: `pkg_${Date.now()}`,
      barbershopId,
      name: pkgName,
      serviceIds: pkgServiceIds,
      productIds: pkgProductIds,
      discountType: pkgDiscountType,
      discountValue: packageDiscountNumeric,
      basePrice: packageBaseValue,
      finalPrice: packageFinalValue,
      savingsValue: packageSavingsValue,
      price: packageFinalValue,
      discountPercent: packageDiscountPercent,
      description: pkgDescription,
      tags: pkgTags,
      validUntil: pkgValidUntil || undefined,
      usageType: pkgUsageType,
      imageUrl: pkgImageUrl || undefined,
    };
    const next = [...packages, newPkg];
    setPackages(next);
    resetPackageForm();
    setShowPackageForm(false);
    syncCatalog(styles, next);
  };

  const openEditPackage = (pkgId: string) => {
    const pkg = packages.find((p) => p.id === pkgId);
    if (!pkg) return;
    setEditingPackageId(pkg.id);
    setPkgName(pkg.name);
    setPkgDescription(pkg.description ?? "");
    setPkgBasePrice(String(pkg.basePrice ?? pkg.price ?? 0));
    setPkgFinalPrice(String(pkg.finalPrice ?? pkg.price ?? 0));
    setPkgDiscountType(pkg.discountType ?? "percentual");
    setPkgDiscountValue(String(pkg.discountValue ?? pkg.discountPercent ?? 0));
    setPkgValidUntil(pkg.validUntil ?? "");
    setPkgUsageType(pkg.usageType ?? "single");
    setPkgTags(((pkg.tags ?? []) as PackageTag[]));
    setPkgServiceIds(pkg.serviceIds ?? []);
    setPkgProductIds(pkg.productIds ?? []);
    setPkgImageUrl(pkg.imageUrl ?? "");
    setPackageStep(1);
    setPackageServiceQuery("");
    setPackageProductQuery("");
    setShowPackageForm(true);
  };

  const updatePackage = () => {
    if (!editingPackageId || !pkgName || (pkgServiceIds.length === 0 && pkgProductIds.length === 0) || packageFinalValue <= 0) return;
    const next = packages.map((p) =>
      p.id === editingPackageId
        ? {
            ...p,
            name: pkgName,
            serviceIds: pkgServiceIds,
            productIds: pkgProductIds,
            discountType: pkgDiscountType,
            discountValue: packageDiscountNumeric,
            basePrice: packageBaseValue,
            finalPrice: packageFinalValue,
            savingsValue: packageSavingsValue,
            price: packageFinalValue,
            discountPercent: packageDiscountPercent,
            description: pkgDescription,
            tags: pkgTags,
            validUntil: pkgValidUntil || undefined,
            usageType: pkgUsageType,
            imageUrl: pkgImageUrl || undefined,
          }
        : p,
    );
    setPackages(next);
    resetPackageForm();
    setShowPackageForm(false);
    setEditingPackageId(null);
    syncCatalog(styles, next);
  };

  const removePackage = (id: string) => {
    const next = packages.filter((p) => p.id !== id);
    setPackages(next);
    syncCatalog(styles, next);
  };

  const openNewServiceForm = () => {
    setEditingStyleId(null);
    setNewName("");
    setNewType("");
    setNewDescription("");
    setNewPrice("");
    setNewDuration(30);
    setNewPhotoUrl("");
    setNewActive(true);
    setFormStep(1);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setShowForm(true);
  };

  const openNewPackageForm = () => {
    setEditingPackageId(null);
    resetPackageForm();
    setPackageStep(1);
    setShowPackageForm(true);
  };

  const switchTab = (nextTab: "services" | "packages") => {
    if (nextTab === activeTab) return;
    setTabDirection(nextTab === "packages" ? 1 : -1);
    setActiveTab(nextTab);
  };

  const team = getTeam(barbershopId);
  const staffOptions = team ? [team.owner, ...team.members] : [];

  const serviceMetrics = (style: HaircutStyle, idx: number) => {
    const price = Number(style.price || 0);
    const bookings = Math.max(6, Math.round((price / 4) + (60 - style.durationMinutes) / 6 + (styles.length - idx)));
    const revenue = bookings * price;
    return { bookings, revenue };
  };

  const filteredStyles = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return styles.filter((style) => {
      const categoryMatch = categoryFilter === "Todos" || style.type === categoryFilter;
      if (!categoryMatch) return false;
      if (!q) return true;
      return style.name.toLowerCase().includes(q) || style.type.toLowerCase().includes(q);
    });
  }, [styles, categoryFilter, searchQuery]);

  const sortedStyles = useMemo(
    () =>
      [...filteredStyles].sort((a, b) => {
        const idxA = styles.findIndex((x) => x.id === a.id);
        const idxB = styles.findIndex((x) => x.id === b.id);
        const ma = serviceMetrics(a, idxA);
        const mb = serviceMetrics(b, idxB);
        if (sortBy === "house") return idxA - idxB;
        if (sortBy === "revenue") return mb.revenue - ma.revenue;
        if (sortBy === "price_high") return Number(b.price) - Number(a.price);
        if (sortBy === "fast") return a.durationMinutes - b.durationMinutes;
        if (sortBy === "recent") return b.id - a.id;
        if (sortBy === "low") return ma.bookings - mb.bookings;
        return mb.bookings - ma.bookings;
      }),
    [filteredStyles, sortBy, styles],
  );

  const featuredServices = useMemo(() => {
    const candidates = styles.filter((s) => s.active !== false);
    const rows = candidates.map((style, idx) => {
      const metric = serviceMetrics(style, idx);
      return { style, idx, metric };
    });
    return rows.sort((a, b) => b.metric.revenue - a.metric.revenue).slice(0, 3);
  }, [styles]);

  const topPackage = packages
    .slice()
    .sort((a, b) => (b.discountPercent ?? 0) - (a.discountPercent ?? 0))[0];
  const potentialLift = topPackage ? Math.round((topPackage.savingsValue ?? 0) / (topPackage.basePrice || 1) * 100) : 0;
  const primaryFilterChips = ["Todos", ...categoryOptions.slice(0, 5)];
  const extraFilterChips = categoryOptions.slice(5);
  const avgTicket = styles.length
    ? styles.reduce((acc, item) => acc + Number(item.price || 0), 0) / styles.length
    : 0;
  const packagesIntro = isModern
    ? "Crie combinações com desconto para aumentar o ticket."
    : "Crie combinações exclusivas com desconto para valorizar o atendimento.";
  const emptyPackagesDescription = isModern
    ? "Crie combinações para aumentar o ticket médio dos atendimentos."
    : "Monte combinações exclusivas para valorizar a experiência do cliente e aumentar o ticket médio.";
  const emptyPackagesAux = isModern
    ? "Pacotes podem aumentar o valor por cliente com ofertas mais estratégicas."
    : "Pacotes bem posicionados ajudam a vender mais com percepção de valor.";
  const packageSteps = [
    { id: 1, title: "Identidade", subtitle: "Nome, imagem e proposta" },
    { id: 2, title: "Itens", subtitle: "Serviços e produtos do combo" },
    { id: 3, title: "Preço", subtitle: "Desconto, validade e uso" },
    { id: 4, title: "Revisão", subtitle: "Ajustes finais e publicação" },
  ] as const;
  const selectedServiceItems = packageServiceOptions.filter((item) => pkgServiceIds.includes(item.id));
  const selectedProductItems = packageProductOptions.filter((item) => pkgProductIds.includes(item.id));
  const filteredPackageServiceOptions = packageServiceOptions.filter((item) =>
    item.name.toLowerCase().includes(packageServiceQuery.trim().toLowerCase()),
  );
  const filteredPackageProductOptions = packageProductOptions.filter((item) =>
    item.name.toLowerCase().includes(packageProductQuery.trim().toLowerCase()),
  );
  const packageCanAdvanceFromStep1 = Boolean(pkgName.trim() && pkgDescription.trim());
  const packageCanAdvanceFromStep2 = Boolean(pkgServiceIds.length > 0 || pkgProductIds.length > 0);
  const packageCanAdvanceFromStep3 = Boolean(packageFinalValue > 0);
  const basicStepValid = Boolean(newName.trim() && newPrice && Number(newPrice) > 0);
  const canGoToOperationStep = basicStepValid && Boolean((newDescription.trim() || newPhotoUrl.trim()));
  const wizardStepMotion = isModern
    ? {
        initial: { opacity: 0, x: 16, y: 2 },
        animate: { opacity: 1, x: 0, y: 0 },
        exit: { opacity: 0, x: -16, y: -2 },
        transition: { duration: 0.18, ease: "easeOut" as const },
      }
    : {
        initial: { opacity: 0, scale: 0.985, y: 6 },
        animate: { opacity: 1, scale: 1, y: 0 },
        exit: { opacity: 0, scale: 0.99, y: -4 },
        transition: { duration: 0.24, ease: "easeOut" as const },
      };
  const wizardCopy = isModern
    ? {
        subtitleNew: "Preencha os dados para criar um novo serviço.",
        subtitleEdit: "Atualize os detalhes do serviço.",
        steps: ["Basico", "Apresentacao", "Operacao"] as const,
        sectionBasic: "Informacoes basicas",
        sectionShowcase: "Apresentacao do servico",
        sectionOperation: "Operacao e disponibilidade",
        nameLabel: "Nome do corte",
        categoryLabel: "Categoria",
        durationLabel: "Duracao (min)",
        priceLabel: "Preco (R$)",
        durationHint: "Dica: corte masculino ~30 min, barba ~20 min, coloracao ~90 min.",
        descriptionLabel: "Descricao do corte",
        descriptionPlaceholder: "Descreva o servico: o que inclui, duracao, estilo...",
        imageLabel: "Imagem do servico",
        imageButtonAdd: "Enviar foto",
        imageButtonReplace: "Trocar foto",
        imageHelp: "Opcional. Adicione uma imagem para ilustrar o servico no app.",
        previewTitle: "Previa do cliente",
        previewFallback: "Descricao curta que ajuda na decisao.",
        assigneeLabel: "Quem executa esse servico",
        activeTitle: "Servico ativo",
        activeDesc: "Visivel para agendamento dos clientes",
        extrasTitle: "Ferramentas extras (opcional)",
        extraGenerate: "Gerar descricao",
        extraOffer: "Criar promocao",
      }
    : {
        subtitleNew: "Defina os detalhes do servico para apresentacao e agendamento.",
        subtitleEdit: "Refine os detalhes do servico para apresentacao e agendamento.",
        steps: ["Essencial", "Vitrine", "Atendimento"] as const,
        sectionBasic: "Essencial do servico",
        sectionShowcase: "Como o cliente ve",
        sectionOperation: "Atendimento e disponibilidade",
        nameLabel: "Nome do servico",
        categoryLabel: "Categoria do servico",
        durationLabel: "Tempo do atendimento (min)",
        priceLabel: "Valor do servico (R$)",
        durationHint: "Referencia: corte masculino ~30 min, barba ~20 min, coloracao ~90 min.",
        descriptionLabel: "Descricao do servico",
        descriptionPlaceholder: "Descreva o atendimento, o que inclui e o resultado esperado...",
        imageLabel: "Imagem do servico",
        imageButtonAdd: "Adicionar foto",
        imageButtonReplace: "Trocar foto",
        imageHelp: "Opcional. Uma boa imagem valoriza a apresentacao do servico.",
        previewTitle: "Como aparece para o cliente",
        previewFallback: "Uma descricao que valoriza o atendimento e a experiencia.",
        assigneeLabel: "Quem realiza este servico",
        activeTitle: "Servico disponivel",
        activeDesc: "Exibido para agendamento dos clientes",
        extrasTitle: "Recursos extras (opcional)",
        extraGenerate: "Sugerir descricao",
        extraOffer: "Criar oferta",
      };

  return (
    <DashboardLayout userType="barbeiro">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        {showPackageForm && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
            <div
              className={cn(
                "glass-card bg-background p-6 w-full max-w-4xl space-y-5 max-h-[92vh] overflow-y-auto border",
                isModern
                  ? "rounded-2xl border-white/10 shadow-[0_20px_60px_-40px_hsl(var(--primary)/0.55)]"
                  : "rounded-xl border-primary/30 shadow-[0_10px_34px_-24px_hsl(var(--primary)/0.45)]",
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className={cn("text-foreground", isModern ? "text-lg font-display font-semibold" : "text-xl font-vintage-display font-semibold")}>
                    {editingPackageId ? "Editar pacote" : "Novo pacote"}
                  </h3>
                  <p className={cn(isModern ? "text-xs text-muted-foreground mt-0.5" : "text-sm text-foreground/70 mt-1")}>
                    {isModern
                      ? "Monte a oferta em 4 etapas para vender melhor por atendimento."
                      : "Estruture a oferta em etapas para valorizar a experiência e o ticket."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    resetPackageForm();
                    setShowPackageForm(false);
                  }}
                  className={cn("text-xs hover:text-foreground", isModern ? "text-muted-foreground" : "text-foreground/75")}
                >
                  Cancelar
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                {packageSteps.map((step) => {
                  const active = packageStep === step.id;
                  const done = packageStep > step.id;
                  return (
                    <button
                      key={step.id}
                      type="button"
                      onClick={() => setPackageStep(step.id)}
                      className={cn(
                        "text-left border px-3 py-2 transition-all",
                        isModern ? "rounded-2xl" : "rounded-lg",
                        active
                          ? isModern
                            ? "border-primary/55 bg-primary/12 shadow-[0_10px_24px_-18px_hsl(var(--primary)/0.8)]"
                            : "border-primary/45 bg-primary/10"
                          : done
                            ? "border-primary/30 bg-primary/5"
                            : isModern
                              ? "border-border/70 bg-secondary/35 hover:bg-secondary/60"
                              : "border-primary/20 bg-secondary/45 hover:bg-secondary/65",
                      )}
                    >
                      <p className={cn("text-[11px]", isModern ? "text-muted-foreground" : "text-foreground/70")}>Etapa {step.id}</p>
                      <p className={cn("text-sm text-foreground", isModern ? "font-semibold" : "font-vintage-display")}>{step.title}</p>
                      <p className={cn("text-[11px]", isModern ? "text-muted-foreground" : "text-foreground/65")}>{step.subtitle}</p>
                    </button>
                  );
                })}
              </div>

              {packageStep === 1 && (
                <div className="grid grid-cols-1 lg:grid-cols-[240px,1fr] gap-4">
                  <div className="space-y-3">
                    <div
                      className={cn(
                        "w-full aspect-square bg-secondary border flex items-center justify-center overflow-hidden",
                        isModern ? "rounded-2xl border-border/70" : "rounded-lg border-primary/25",
                      )}
                    >
                      {pkgImageUrl ? (
                        <img src={pkgImageUrl} alt={pkgName || "Imagem do pacote"} className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className={cn("w-9 h-9 text-muted-foreground", isModern ? "stroke-[1.7]" : "stroke-[2]")} />
                      )}
                    </div>
                    <input type="file" accept="image/*" onChange={handlePackageImageChange} className="hidden" id="package-image" />
                    <Label htmlFor="package-image" className="cursor-pointer inline-flex items-center text-xs text-foreground/80 hover:text-foreground">
                      <Camera className={cn("w-4 h-4 mr-1", isModern ? "stroke-[1.7]" : "stroke-[2]")} />
                      {pkgImageUrl ? "Trocar imagem" : "Adicionar imagem do pacote"}
                    </Label>
                  </div>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Nome do pacote</Label>
                      <Input value={pkgName} onChange={(e) => setPkgName(e.target.value)} placeholder="Ex: Combo Premium" className="bg-secondary border-border" />
                      <p className={cn("text-[11px]", isModern ? "text-muted-foreground" : "text-foreground/65")}>Dica: use um nome comercial simples e fácil de lembrar.</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Descrição comercial</Label>
                      <Textarea
                        value={pkgDescription}
                        onChange={(e) => setPkgDescription(e.target.value)}
                        className="bg-secondary border-border min-h-[96px]"
                        placeholder="Oferta ideal para visual completo com economia."
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Tags de destaque</Label>
                      <div className="flex gap-2 flex-wrap">
                        {(["Mais vendido", "Premium", "Promocao"] as PackageTag[]).map((tag) => {
                          const selected = pkgTags.includes(tag);
                          return (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => setPkgTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))}
                              className={cn(
                                "px-3 py-1 rounded-full text-xs border",
                                selected ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground",
                              )}
                            >
                              {tag}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {packageStep === 2 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Serviços incluídos</Label>
                    <Input
                      value={packageServiceQuery}
                      onChange={(e) => setPackageServiceQuery(e.target.value)}
                      placeholder="Buscar serviço..."
                      className="bg-secondary border-border"
                    />
                    <div className={cn("max-h-56 overflow-y-auto border bg-secondary/40 p-2 space-y-1", isModern ? "rounded-xl border-border" : "rounded-lg border-primary/20")}>
                      {filteredPackageServiceOptions.map((item) => {
                        const selected = pkgServiceIds.includes(item.id);
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() =>
                              setPkgServiceIds((prev) => (prev.includes(item.id) ? prev.filter((id) => id !== item.id) : [...prev, item.id]))
                            }
                            className={cn(
                              "w-full text-left border px-3 py-2 text-sm transition-colors",
                              isModern ? "rounded-xl" : "rounded-md",
                              selected ? "border-primary/50 bg-primary/10" : "border-border bg-background/50 hover:bg-background/70",
                            )}
                          >
                            <p className="font-medium text-foreground">{item.name}</p>
                            <p className={cn("text-xs", isModern ? "text-muted-foreground" : "text-foreground/70")}>R$ {item.price.toFixed(2)}</p>
                          </button>
                        );
                      })}
                    </div>
                    <p className={cn("text-[11px]", isModern ? "text-muted-foreground" : "text-foreground/70")}>{selectedServiceItems.length} serviço(s) selecionado(s)</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Produtos incluídos</Label>
                    <Input
                      value={packageProductQuery}
                      onChange={(e) => setPackageProductQuery(e.target.value)}
                      placeholder="Buscar produto..."
                      className="bg-secondary border-border"
                    />
                    <div className={cn("max-h-56 overflow-y-auto border bg-secondary/40 p-2 space-y-1", isModern ? "rounded-xl border-border" : "rounded-lg border-primary/20")}>
                      {filteredPackageProductOptions.map((item) => {
                        const selected = pkgProductIds.includes(item.id);
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() =>
                              setPkgProductIds((prev) => (prev.includes(item.id) ? prev.filter((id) => id !== item.id) : [...prev, item.id]))
                            }
                            className={cn(
                              "w-full text-left border px-3 py-2 text-sm transition-colors",
                              isModern ? "rounded-xl" : "rounded-md",
                              selected ? "border-primary/50 bg-primary/10" : "border-border bg-background/50 hover:bg-background/70",
                            )}
                          >
                            <p className="font-medium text-foreground">{item.name}</p>
                            <p className={cn("text-xs", isModern ? "text-muted-foreground" : "text-foreground/70")}>R$ {item.price.toFixed(2)}</p>
                          </button>
                        );
                      })}
                    </div>
                    <p className={cn("text-[11px]", isModern ? "text-muted-foreground" : "text-foreground/70")}>{selectedProductItems.length} produto(s) selecionado(s)</p>
                  </div>
                </div>
              )}

              {packageStep === 3 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Tipo de desconto</Label>
                        <select
                          value={pkgDiscountType}
                          onChange={(e) => setPkgDiscountType(e.target.value as "percentual" | "fixo")}
                          className="w-full rounded-md border border-border bg-secondary px-2 py-2 text-sm"
                        >
                          <option value="percentual">Percentual (%)</option>
                          <option value="fixo">Valor fixo (R$)</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Valor do desconto</Label>
                        <Input type="number" value={pkgDiscountValue} onChange={(e) => setPkgDiscountValue(e.target.value)} className="bg-secondary border-border" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Preço normal (R$)</Label>
                        <Input value={pkgBasePrice} readOnly className="bg-secondary border-border text-muted-foreground" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Preço do pacote (R$)</Label>
                        <Input type="number" value={pkgFinalPrice} onChange={(e) => setPkgFinalPrice(e.target.value)} className="bg-secondary border-border" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Validade</Label>
                        <Input type="date" value={pkgValidUntil} onChange={(e) => setPkgValidUntil(e.target.value)} className="bg-secondary border-border" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Uso</Label>
                        <select
                          value={pkgUsageType}
                          onChange={(e) => setPkgUsageType(e.target.value as "single" | "multiple")}
                          className="w-full rounded-md border border-border bg-secondary px-2 py-2 text-sm"
                        >
                          <option value="single">Uso único</option>
                          <option value="multiple">Pode usar várias vezes</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className={cn("border border-primary/30 bg-primary/10 p-4", isModern ? "rounded-2xl" : "rounded-lg")}>
                    <p className={cn("text-xs", isModern ? "text-muted-foreground" : "text-foreground/75")}>Resumo de preço</p>
                    <p className="text-sm text-foreground mt-1">Valor base dos itens: R$ {packageBaseValue.toFixed(2)}</p>
                    <p className="text-sm text-foreground">Preço final do pacote: R$ {packageFinalValue.toFixed(2)}</p>
                    <p className="text-xs text-emerald-400 mt-2">Economia total: R$ {packageSavingsValue.toFixed(2)} ({packageDiscountPercent}% OFF)</p>
                    <p className={cn("text-xs mt-2", isModern ? "text-muted-foreground" : "text-foreground/70")}>
                      {pkgValidUntil ? `Válido até ${new Date(pkgValidUntil).toLocaleDateString("pt-BR")}` : "Sem validade definida"}
                    </p>
                  </div>
                </div>
              )}

              {packageStep === 4 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className={cn("border border-primary/30 bg-primary/10 p-4", isModern ? "rounded-2xl" : "rounded-lg")}>
                    <p className={cn("text-xs", isModern ? "text-muted-foreground" : "text-foreground/75")}>Preview comercial</p>
                    <p className="font-display font-semibold text-foreground mt-1">{pkgName || "Combo Premium"}</p>
                    <p className={cn("text-xs mt-1", isModern ? "text-muted-foreground" : "text-foreground/70")}>{pkgDescription || "Pacote estratégico para aumentar conversão."}</p>
                    <p className={cn("text-xs mt-2", isModern ? "text-muted-foreground" : "text-foreground/70")}>Itens: {pkgServiceIds.length} serviço(s) + {pkgProductIds.length} produto(s)</p>
                    <div className="mt-2 flex items-end gap-2">
                      <span className={cn("text-xs line-through", isModern ? "text-muted-foreground" : "text-foreground/60")}>R$ {packageBaseValue.toFixed(2)}</span>
                      <span className="text-lg font-semibold text-primary">R$ {packageFinalValue.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className={cn("border bg-secondary/30 p-4 space-y-2", isModern ? "rounded-2xl border-border" : "rounded-lg border-primary/20")}>
                    <p className={cn("text-xs", isModern ? "text-muted-foreground" : "text-foreground/75")}>Checklist final</p>
                    <p className="text-sm text-foreground">{pkgName ? "Nome definido" : "Falta nome do pacote"}</p>
                    <p className="text-sm text-foreground">
                      {pkgServiceIds.length || pkgProductIds.length ? "Itens selecionados" : "Falta selecionar serviços ou produtos"}
                    </p>
                    <p className="text-sm text-foreground">{packageFinalValue > 0 ? "Preço válido" : "Preço final inválido"}</p>
                    <p className={cn("text-[11px] pt-1", isModern ? "text-muted-foreground" : "text-foreground/65")}>Se algo não estiver pronto, volte para a etapa correspondente antes de salvar.</p>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "border",
                    isModern
                      ? "rounded-2xl border-border/70 bg-background/40 hover:bg-secondary/60"
                      : "rounded-md border-primary/25 bg-background/20 hover:bg-secondary/70",
                  )}
                  onClick={() => setPackageStep((prev) => (prev > 1 ? ((prev - 1) as 1 | 2 | 3 | 4) : prev))}
                  disabled={packageStep === 1}
                >
                  Voltar etapa
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "border",
                      isModern
                        ? "rounded-2xl border-border/70 bg-background/40 hover:bg-secondary/60"
                        : "rounded-md border-primary/25 bg-background/20 hover:bg-secondary/70",
                    )}
                    onClick={() => {
                      resetPackageForm();
                      setShowPackageForm(false);
                    }}
                  >
                    Cancelar
                  </Button>
                  {packageStep < 4 ? (
                    <Button
                      size="sm"
                      className={cn(
                        "bg-primary text-primary-foreground hover:bg-primary/90",
                        isModern ? "rounded-2xl shadow-[0_8px_20px_-14px_hsl(var(--primary)/0.9)]" : "rounded-md",
                      )}
                      onClick={() => setPackageStep((prev) => (prev < 4 ? ((prev + 1) as 1 | 2 | 3 | 4) : prev))}
                      disabled={
                        (packageStep === 1 && !packageCanAdvanceFromStep1)
                        || (packageStep === 2 && !packageCanAdvanceFromStep2)
                        || (packageStep === 3 && !packageCanAdvanceFromStep3)
                      }
                    >
                      Continuar
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      className={cn(
                        "bg-primary text-primary-foreground hover:bg-primary/90",
                        isModern ? "rounded-2xl shadow-[0_8px_20px_-14px_hsl(var(--primary)/0.9)]" : "rounded-md",
                      )}
                      onClick={editingPackageId ? updatePackage : addPackage}
                      disabled={!packageCanAdvanceFromStep1 || !packageCanAdvanceFromStep2 || !packageCanAdvanceFromStep3}
                    >
                      {editingPackageId ? "Salvar alterações" : "Criar pacote"}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div
          className={cn(
            "relative overflow-hidden border p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4",
            isModern
              ? "rounded-2xl border-white/10 bg-card/80"
              : "rounded-xl border-primary/25 bg-gradient-to-b from-card via-card to-card/90",
          )}
        >
          {isModern && (
            <div
              className="pointer-events-none absolute inset-x-8 top-0 h-14 opacity-70"
              style={{ background: "radial-gradient(ellipse at top, hsl(var(--primary) / 0.22), transparent 72%)" }}
            />
          )}
          <div className="relative">
            <p className={cn("text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground", !isModern && "text-primary/70")}>
              {isModern ? "SERVIÇOS" : "BARBERFLOW CONTROL"}
            </p>
            <h1
              className={cn(
                "text-2xl lg:text-3xl font-bold",
                isModern ? "font-display text-gradient-gold" : "font-vintage-display text-gradient-gold",
              )}
            >
              {isModern ? "Catálogo de serviços" : "Serviços da casa"}
            </h1>
            {!isModern && (
              <div className="mt-1 h-px w-36 bg-gradient-to-r from-primary/65 via-primary/25 to-transparent" />
            )}
            <p className="text-muted-foreground text-sm mt-1">
              {isModern
                ? "Gerencie serviços, acompanhe desempenho e ajuste a oferta da operação."
                : "Organize o que a casa oferece, acompanhe a procura e ajuste o que mais move resultado."}
            </p>
          </div>
          <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-2 sm:items-center">
            {activeTab === "services" && (
              <Button
                variant="outline"
                className={cn(
                  "w-full sm:w-auto h-11 min-h-11 px-5 text-sm font-semibold gap-2",
                  isModern ? "rounded-2xl" : "rounded-lg border-primary/35 hover:border-primary/55",
                )}
                onClick={openNewPackageForm}
              >
                <Plus className={cn("w-4 h-4 shrink-0", isModern ? "stroke-[1.7]" : "stroke-[2]")} />
                Criar pacote
              </Button>
            )}
            <Button
              className={cn(
                "relative w-full sm:w-auto h-11 min-h-11 px-5 text-sm font-semibold bg-primary text-primary-foreground gap-2 [&_svg]:mr-0 transition-all",
                isModern
                  ? "duration-200 rounded-2xl hover:-translate-y-0.5 hover:bg-primary/95 hover:shadow-[0_8px_24px_-16px_hsl(var(--primary)/0.85)]"
                  : "duration-150 rounded-lg border border-primary/35 hover:bg-primary/90",
              )}
              onClick={activeTab === "services" ? openNewServiceForm : openNewPackageForm}
            >
              <Plus className={cn("w-4 h-4 shrink-0", isModern ? "stroke-[1.7]" : "stroke-[2]")} />
              {activeTab === "services" ? (isModern ? "Novo serviço" : "Adicionar serviço") : "Criar pacote"}
            </Button>
          </div>
        </div>

        <div
          className={cn(
            "inline-flex border bg-card p-1 shadow-sm transition-all duration-300",
            isModern ? "rounded-2xl border-border/55" : "rounded-xl border-primary/30",
          )}
        >
          <button
            type="button"
            onClick={() => switchTab("services")}
            className={`theme-chip px-5 py-1.5 text-xs font-medium transition-all ${
              activeTab === "services"
                ? cn(
                    "text-primary-foreground rounded-xl",
                    isModern
                      ? "bg-primary shadow-[0_8px_18px_-14px_hsl(var(--primary)/0.9)]"
                      : "bg-primary/90 border-primary/50 shadow-[inset_0_-1px_0_hsl(var(--primary-foreground)/0.35)]",
                  )
                : cn(
                    "text-muted-foreground rounded-xl",
                    isModern
                      ? "duration-200 hover:text-foreground hover:bg-secondary/70 hover:-translate-y-0.5"
                      : "duration-150 hover:text-foreground hover:bg-secondary/45",
                  )
            }`}
          >
            {isModern ? "Serviços" : "Serviços da casa"}
          </button>
          <button
            type="button"
            onClick={() => switchTab("packages")}
            className={`theme-chip px-5 py-1.5 text-xs font-medium transition-all ${
              activeTab === "packages"
                ? cn(
                    "text-primary-foreground rounded-xl",
                    isModern
                      ? "bg-primary shadow-[0_8px_18px_-14px_hsl(var(--primary)/0.9)]"
                      : "bg-primary/90 border-primary/50 shadow-[inset_0_-1px_0_hsl(var(--primary-foreground)/0.35)]",
                  )
                : cn(
                    "text-muted-foreground rounded-xl",
                    isModern
                      ? "duration-200 hover:text-foreground hover:bg-secondary/70 hover:-translate-y-0.5"
                      : "duration-150 hover:text-foreground hover:bg-secondary/45",
                  )
            }`}
          >
            Pacotes
          </button>
        </div>

        <AnimatePresence mode="wait" initial={false}>
        {activeTab === "services" && (
        <motion.div
          key="services-tab-content"
          initial={{ opacity: 0, x: 18 * tabDirection, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, x: -18 * tabDirection, y: -6 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="space-y-4"
        >
        <motion.div
          key="services-banner"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className={cn(
            "p-4 sm:p-5",
            isModern ? "rounded-2xl border border-border/60 bg-card/70" : "rounded-xl border border-primary/25 bg-gradient-to-b from-card via-card to-card/90",
          )}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className={cn("text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground", !isModern && "text-primary/70")}>
                {isModern ? "Resumo da oferta" : "Serviços"}
              </p>
              <h2 className={cn("mt-1 text-base font-semibold text-foreground", !isModern && "font-display text-lg")}>
                {isModern ? "Pacotes e ticket" : "O que mais rende na casa"}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {packages.length > 0
                  ? "Seus pacotes já ajudam a elevar o valor médio por atendimento."
                  : isModern
                    ? "Pacotes ajudam a aumentar o valor médio por atendimento."
                    : "Pacotes e combinações ajudam a valorizar o atendimento e aumentam o retorno por cliente."}
              </p>
            </div>
            <Button
              variant="outline"
              className="h-9 min-h-9 rounded-md px-4 text-xs font-semibold w-full sm:w-auto shrink-0"
              onClick={openNewPackageForm}
            >
              Criar pacote
            </Button>
          </div>
          {topPackage && (
            <div className={cn("mt-4 rounded-xl border p-3", isModern ? "border-border/60 bg-muted/10" : "border-primary/25 bg-black/15")}>
              <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/70">Pacote em evidência</p>
              <div className="mt-2 flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-foreground">{topPackage.name} — R$ {(topPackage.finalPrice ?? topPackage.price ?? 0).toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">
                    {topPackage.discountPercent ?? 0}% off • economiza R$ {(topPackage.savingsValue ?? 0).toFixed(2)}
                  </p>
                </div>
                <span className="text-xs font-bold text-primary">+{potentialLift}%</span>
              </div>
            </div>
          )}
        </motion.div>

        <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/45 backdrop-blur-sm px-4"
            onClick={() => resetForm()}
          >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 240, damping: 22 }}
            className={cn(
              "glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto",
              isModern ? "rounded-2xl p-4 sm:p-5 space-y-4" : "rounded-xl p-5 sm:p-6 space-y-5 border border-primary/20",
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className={cn("text-foreground", isModern ? "text-lg font-display font-semibold" : "text-xl font-vintage-display font-semibold")}>
                  {editingStyleId != null ? "Editar serviço" : "Novo serviço"}
                </h3>
                <p className={cn("text-muted-foreground", isModern ? "text-xs mt-0.5" : "text-sm mt-1")}>
                  {editingStyleId != null ? wizardCopy.subtitleEdit : wizardCopy.subtitleNew}
                </p>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={resetForm}>
                Cancelar
              </Button>
            </div>
            <div className={cn("flex items-center gap-2", isModern ? "" : "pt-1")}>
              <div className="w-full space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span className={cn(isModern ? "text-muted-foreground" : "text-foreground/70")}>Etapa {formStep} de 3</span>
                  <span className={cn(isModern ? "text-muted-foreground" : "text-foreground/75")}>{formStep === 1 ? "33%" : formStep === 2 ? "66%" : "100%"}</span>
                </div>
                <div
                  className={cn(
                    "h-1.5 w-full overflow-hidden",
                    isModern ? "rounded-full bg-secondary/70" : "rounded-sm border border-primary/20 bg-secondary/55",
                  )}
                >
                  <motion.div
                    className={cn("h-full", isModern ? "bg-primary" : "bg-gradient-to-r from-primary/80 to-primary")}
                    initial={false}
                    animate={{ width: formStep === 1 ? "33%" : formStep === 2 ? "66%" : "100%" }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                  />
                </div>
              </div>
            </div>

            <div
              className={cn(
                "flex items-center gap-2",
                isModern ? "" : "rounded-lg border border-primary/20 bg-card/45 p-1.5 mb-1",
              )}
            >
              {[
                { id: 1 as const, label: wizardCopy.steps[0] },
                { id: 2 as const, label: wizardCopy.steps[1] },
                { id: 3 as const, label: wizardCopy.steps[2] },
              ].map((step, idx) => (
                <div key={step.id} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (step.id === 1) setFormStep(1);
                      if (step.id === 2 && basicStepValid) setFormStep(2);
                      if (step.id === 3 && canGoToOperationStep) setFormStep(3);
                    }}
                    className={cn(
                      "h-8 px-3 text-xs font-medium transition",
                      isModern ? "rounded-full" : "rounded-md border",
                      formStep === step.id
                        ? cn(
                            "bg-primary text-primary-foreground",
                            isModern ? "" : "border-primary/45 shadow-[inset_0_-1px_0_hsl(var(--primary-foreground)/0.35)]",
                          )
                        : cn(
                            "text-muted-foreground hover:text-foreground",
                            isModern ? "bg-secondary/50" : "border-border/60 bg-secondary/35",
                          ),
                    )}
                  >
                    {step.id}. {step.label}
                  </button>
                  {!isModern && idx < 2 && <span className="h-px w-3 bg-primary/25" aria-hidden />}
                </div>
              ))}
            </div>

            <AnimatePresence mode="wait" initial={false}>
            {formStep === 1 && (
              <motion.div
                key="service-form-step-1"
                initial={wizardStepMotion.initial}
                animate={wizardStepMotion.animate}
                exit={wizardStepMotion.exit}
                transition={wizardStepMotion.transition}
                className={cn(
                  "rounded-xl border bg-card/70",
                  isModern ? "border-border/60 p-3 space-y-3" : "border-primary/20 p-4 space-y-3.5",
                )}
              >
                <p className={cn("text-xs font-semibold uppercase tracking-wide", isModern ? "text-muted-foreground" : "text-foreground/75")}>{wizardCopy.sectionBasic}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-foreground/80 text-sm">{wizardCopy.nameLabel}</Label>
                    <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Ex: Corte Social" className="bg-secondary border-border" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-foreground/80 text-sm">{wizardCopy.categoryLabel}</Label>
                    <select
                      value={newType}
                      onChange={(e) => {
                        setNewType(e.target.value);
                        const tip = DEFAULT_DURATION_BY_CATEGORY[e.target.value];
                        if (tip != null) setNewDuration(tip);
                      }}
                      className="w-full rounded-lg bg-secondary border border-border px-3 py-2 text-sm text-foreground"
                    >
                      <option value="">Selecione</option>
                      {SERVICE_CATEGORIES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-foreground/80 text-sm flex items-center gap-1">
                      <Clock className={cn("w-3.5 h-3.5", isModern ? "stroke-[1.7]" : "stroke-[2]")} /> {wizardCopy.durationLabel}
                    </Label>
                    <Input type="number" min={5} max={180} value={newDuration} onChange={(e) => setNewDuration(parseInt(e.target.value, 10) || 30)} className="bg-secondary border-border" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-foreground/80 text-sm">{wizardCopy.priceLabel}</Label>
                    <Input type="number" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} placeholder="45" className="bg-secondary border-border" />
                  </div>
                </div>
                <p className={cn("text-xs", isModern ? "text-muted-foreground" : "text-foreground/65")}>{wizardCopy.durationHint}</p>
              </motion.div>
            )}

            {formStep === 2 && (
              <motion.div
                key="service-form-step-2"
                initial={wizardStepMotion.initial}
                animate={wizardStepMotion.animate}
                exit={wizardStepMotion.exit}
                transition={wizardStepMotion.transition}
                className={cn(
                  "rounded-xl border bg-card/70",
                  isModern ? "border-border/60 p-3 space-y-3" : "border-primary/20 p-4 space-y-3.5",
                )}
              >
                <p className={cn("text-xs font-semibold uppercase tracking-wide", isModern ? "text-muted-foreground" : "text-foreground/75")}>{wizardCopy.sectionShowcase}</p>
                <div className="space-y-1.5">
                  <Label className="text-foreground/80 text-sm">{wizardCopy.descriptionLabel}</Label>
                  <Textarea
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder={wizardCopy.descriptionPlaceholder}
                    className="bg-secondary border-border min-h-[90px] resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-foreground/80 text-sm">{wizardCopy.imageLabel}</Label>
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-24 rounded-xl bg-secondary border border-border flex items-center justify-center overflow-hidden">
                      {newPhotoUrl ? (
                        <img src={newPhotoUrl} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className={cn("w-9 h-9 text-muted-foreground", isModern ? "stroke-[1.7]" : "stroke-[2]")} />
                      )}
                    </div>
                    <div>
                      <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" id="photo-cut" />
                      <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="gap-2">
                        <Camera className={cn("w-4 h-4", isModern ? "stroke-[1.7]" : "stroke-[2]")} />
                        {newPhotoUrl ? wizardCopy.imageButtonReplace : wizardCopy.imageButtonAdd}
                      </Button>
                    </div>
                  </div>
                  <Input value={newPhotoUrl} onChange={(e) => setNewPhotoUrl(e.target.value)} placeholder="URL da imagem (opcional)" className="bg-secondary border-border mt-1" />
                  <p className={cn("text-[11px]", isModern ? "text-muted-foreground" : "text-foreground/65")}>{wizardCopy.imageHelp}</p>
                </div>

                <div className={cn("rounded-lg p-3", isModern ? "border border-primary/30 bg-primary/5" : "border border-primary/35 bg-primary/8 shadow-[inset_0_1px_0_hsl(var(--primary-foreground)/0.08)]")}>
                  <p className={cn("text-xs mb-1 inline-flex items-center gap-1", isModern ? "text-muted-foreground" : "text-foreground/75")}>
                    <Eye className={cn("w-3.5 h-3.5 text-primary", isModern ? "stroke-[1.7]" : "stroke-[2]")} />
                    {wizardCopy.previewTitle}
                  </p>
                  <p className="font-semibold text-foreground">{newName || "Nome do servico"}</p>
                  <p className="text-sm text-primary font-medium">R$ {Number(newPrice || 0).toFixed(2)} • {newDuration} min</p>
                  <p className={cn("text-xs mt-1 line-clamp-2", isModern ? "text-muted-foreground" : "text-foreground/70")}>{newDescription || wizardCopy.previewFallback}</p>
                </div>
              </motion.div>
            )}

            {formStep === 3 && (
              <motion.div
                key="service-form-step-3"
                initial={wizardStepMotion.initial}
                animate={wizardStepMotion.animate}
                exit={wizardStepMotion.exit}
                transition={wizardStepMotion.transition}
                className={cn("space-y-3", isModern ? "" : "space-y-3.5")}
              >
                <div className={cn("rounded-xl border bg-card/70", isModern ? "border-border/60 p-3 space-y-3" : "border-primary/20 p-4 space-y-3.5")}>
                  <p className={cn("text-xs font-semibold uppercase tracking-wide", isModern ? "text-muted-foreground" : "text-foreground/75")}>{wizardCopy.sectionOperation}</p>
                  {staffOptions.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-foreground/80 text-sm flex items-center gap-1">
                        <Users className={cn("w-3.5 h-3.5", isModern ? "stroke-[1.7]" : "stroke-[2]")} /> {wizardCopy.assigneeLabel}
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {staffOptions.map((p) => {
                          const current = styles.find((s) => s.id === editingStyleId);
                          const assigned = current?.assignedMemberIds?.includes(p.userId) ?? false;
                          return (
                            <button
                              key={p.userId}
                              type="button"
                              onClick={() => {
                                if (editingStyleId == null) return;
                                const next = styles.map((s) => {
                                  if (s.id !== editingStyleId) return s;
                                  const ids = s.assignedMemberIds ?? [];
                                  const updated = ids.includes(p.userId) ? ids.filter((id) => id !== p.userId) : [...ids, p.userId];
                                  return { ...s, assignedMemberIds: updated };
                                });
                                setStyles(next);
                              }}
                              className={`px-3 py-1 rounded-full text-xs border ${assigned ? "bg-primary/15 border-primary/50 text-primary" : "bg-secondary/50 border-border text-muted-foreground"}`}
                            >
                              {p.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08 }}
                    whileHover={{ y: -1 }}
                    className={cn("rounded-lg p-3 flex items-center justify-between", isModern ? "bg-secondary/40 border border-border" : "bg-secondary/35 border border-primary/20")}
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">{wizardCopy.activeTitle}</p>
                      <p className={cn("text-xs", isModern ? "text-muted-foreground" : "text-foreground/70")}>{wizardCopy.activeDesc}</p>
                    </div>
                    <button type="button" onClick={() => setNewActive((v) => !v)} className="text-muted-foreground hover:text-foreground" title="Alternar ativo/inativo">
                      {newActive ? (
                        <ToggleRight className={cn("w-7 h-7 text-emerald-400", isModern ? "stroke-[1.7]" : "stroke-[2]")} />
                      ) : (
                        <ToggleLeft className={cn("w-7 h-7", isModern ? "stroke-[1.7]" : "stroke-[2]")} />
                      )}
                    </button>
                  </motion.div>
                </div>

                <div className={cn("rounded-xl border border-dashed bg-card/40", isModern ? "border-border/70 p-3" : "border-primary/25 p-4")}>
                  <p className={cn("text-xs font-semibold uppercase tracking-wide", isModern ? "text-muted-foreground" : "text-foreground/75")}>{wizardCopy.extrasTitle}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={generateDescription}>
                      <Sparkles className={cn("w-3.5 h-3.5 mr-1", isModern ? "stroke-[1.7]" : "stroke-[2]")} /> {wizardCopy.extraGenerate}
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={openCreatePromotionForService}>
                      <Tag className={cn("w-3.5 h-3.5 mr-1", isModern ? "stroke-[1.7]" : "stroke-[2]")} /> {wizardCopy.extraOffer}
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
            </AnimatePresence>

            <div className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between", isModern ? "" : "pt-1")}>
              <div>
                {formStep > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setFormStep((prev) => (prev === 3 ? 2 : 1))}
                    className={cn(
                      "transition-all",
                      isModern
                        ? "duration-150 hover:-translate-y-0.5"
                        : "duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_-16px_hsl(var(--primary)/0.55)]",
                    )}
                  >
                    Voltar
                  </Button>
                )}
              </div>
              {formStep < 3 ? (
                <Button
                  type="button"
                  onClick={() => setFormStep((prev) => (prev === 1 ? 2 : 3))}
                  disabled={(formStep === 1 && !basicStepValid) || (formStep === 2 && !canGoToOperationStep)}
                  className={cn(
                    "h-11 min-h-11 rounded-md px-6 text-sm font-semibold bg-primary text-primary-foreground w-full sm:w-auto transition-all",
                    isModern
                      ? "duration-150 hover:bg-primary/90 hover:-translate-y-0.5"
                      : "duration-200 hover:bg-primary/92 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-18px_hsl(var(--primary)/0.65)]",
                  )}
                >
                  Continuar
                </Button>
              ) : (
                <motion.div
                  whileHover={isModern ? { scale: 1.015, y: -1 } : { scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.985 }}
                  transition={{ duration: isModern ? 0.12 : 0.18, ease: "easeOut" }}
                  className="inline-flex max-w-full w-full sm:w-auto"
                >
                  <Button
                    onClick={editingStyleId != null ? updateStyle : addStyle}
                    className={cn(
                      "h-11 min-h-11 rounded-md px-6 sm:px-8 text-sm font-semibold bg-primary text-primary-foreground w-full sm:w-auto transition-all",
                      isModern
                        ? "duration-150 hover:bg-primary/90"
                        : "duration-200 hover:bg-primary/92 hover:shadow-[0_14px_30px_-18px_hsl(var(--primary)/0.7)]",
                    )}
                  >
                    {editingStyleId != null ? "Salvar serviço" : "Salvar serviço"}
                  </Button>
                </motion.div>
              )}
            </div>
          </motion.div>
          </motion.div>
        )}
        </AnimatePresence>

        {activeTab === "services" && (
          <motion.div
            key="services-controls"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, ease: "easeOut", delay: 0.03 }}
            className="space-y-2"
          >
          <div className="flex flex-col lg:flex-row lg:items-center gap-2">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isModern ? "Buscar serviço" : "Buscar na casa..."}
              className="h-9 lg:max-w-sm bg-secondary/50 border-border"
            />
            <div className="flex items-center gap-2 lg:ml-auto">
              <span className="text-xs text-muted-foreground">{isModern ? "Ordenar por" : "Olhar por"}</span>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)} className="h-9 rounded-md bg-secondary border border-border px-2 py-1 text-xs">
                {!isModern && <option value="house">Ordem da casa</option>}
                <option value="popular">{isModern ? "Popularidade" : "Mais procurados"}</option>
                <option value="revenue">Maior faturamento</option>
                <option value="price_high">{isModern ? "Maior ticket" : "Alto ticket"}</option>
                <option value="fast">Melhor saída</option>
                <option value="recent">Mais recentes</option>
                <option value="low">{isModern ? "Menor saída" : "Precisa atenção"}</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
          {primaryFilterChips.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`theme-chip px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                categoryFilter === cat
                  ? cn(
                      "theme-chip-active bg-primary text-primary-foreground border-primary",
                      isModern ? "" : "shadow-[inset_0_-1px_0_hsl(var(--primary-foreground)/0.35)]",
                    )
                  : cn(
                      "bg-secondary/60 text-muted-foreground border-border hover:bg-secondary",
                      isModern ? "" : "hover:border-primary/30",
                    )
              }`}
            >
              {cat === "Todos" ? "Todos os serviços" : cat}
            </button>
          ))}
            {extraFilterChips.length > 0 && (
              <button
                type="button"
                onClick={() => setShowAllFilters((v) => !v)}
                className="theme-chip px-3 py-1 rounded-full text-xs font-medium border bg-secondary/60 text-muted-foreground border-border hover:bg-secondary"
              >
                {showAllFilters ? "Ocultar filtros" : "+ mais filtros"}
              </button>
            )}
          </div>
          {showAllFilters && extraFilterChips.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card p-2">
              {extraFilterChips.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  className={`theme-chip px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    categoryFilter === cat
                      ? cn(
                          "theme-chip-active bg-primary text-primary-foreground border-primary",
                          isModern ? "" : "shadow-[inset_0_-1px_0_hsl(var(--primary-foreground)/0.35)]",
                        )
                      : cn(
                          "bg-secondary/60 text-muted-foreground border-border hover:bg-secondary",
                          isModern ? "" : "hover:border-primary/30",
                        )
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </motion.div>
        )}

        {activeTab === "services" && (
        <motion.div
          key="services-list"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, ease: "easeOut", delay: 0.06 }}
          className="space-y-3"
        >
          {sortedStyles.length > 0 && (
            <div className={cn("rounded-2xl border p-4 sm:p-5", isModern ? "bg-card/70 border-border/60" : "bg-black/15 border-primary/25")}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className={cn("text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground", !isModern && "text-primary/70")}>
                    {isModern ? "Serviços em destaque" : "Serviços que puxam a casa"}
                  </p>
                  <p className={cn("text-sm text-muted-foreground mt-1", !isModern && "italic opacity-80")}>
                    {isModern ? "Os serviços com melhor desempenho no período." : "Os atendimentos que mais sustentam o ritmo da semana."}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">{styles.length} serviços</span>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                {featuredServices.map(({ style, idx, metric }, rank) => {
                  const price = Number(style.price || 0);
                  const hasHighDemand = metric.bookings >= 18;
                  const hasHighTicket = price >= avgTicket && avgTicket > 0;
                  const hasFastTurn = style.durationMinutes <= 30;
                  const modernTag =
                    rank === 0 ? "Maior faturamento" : hasHighTicket ? "Maior ticket" : hasHighDemand ? "Mais vendido" : "Bom desempenho";
                  const vintageTag =
                    style.promoted ? "Assinatura da casa" : rank === 0 ? "Maior retorno" : hasHighDemand ? "Boa saída" : hasFastTurn ? "Escolha clássica" : "Acabamento premium";
                  const metricLine = isModern
                    ? `${style.durationMinutes} min • ${metric.bookings} agendamentos/semana • R$ ${metric.revenue.toLocaleString("pt-BR")} resultado`
                    : `${style.durationMinutes} min • ${metric.bookings} agendamentos/semana • R$ ${metric.revenue.toLocaleString("pt-BR")} faturados`;
                  return (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => openEditForm(style)}
                      className={cn(
                        "text-left rounded-2xl border px-4 py-3 transition-all hover:-translate-y-0.5",
                        isModern ? "bg-muted/10 border-border/60 hover:border-primary/30" : "bg-black/20 border-[hsl(var(--gold)/0.12)] hover:border-[hsl(var(--gold)/0.3)]",
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground truncate">{style.name}</p>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{style.description || "Serviço com acabamento profissional e leitura de demanda."}</p>
                        </div>
                        <p className="text-sm font-bold text-foreground shrink-0">R$ {price.toFixed(2)}</p>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                            isModern ? "border-primary/35 bg-primary/10 text-primary" : "border-primary/35 bg-gradient-to-r from-primary/25 to-primary/10 text-primary-foreground",
                          )}
                        >
                          {isModern ? modernTag : `◇ ${vintageTag}`}
                        </span>
                        {hasFastTurn && (
                          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">rápido giro</span>
                        )}
                      </div>
                      <p className="mt-2 text-[11px] text-muted-foreground">{metricLine}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex items-end justify-between gap-3">
            <div>
              <p className={cn("text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground", !isModern && "text-primary/70")}>
                {isModern ? "Todos os serviços" : "Catálogo vivo da casa"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {isModern ? "Leitura de volume, duração e retorno por serviço." : "Cada item carrega ritmo, procura e retorno do período."}
              </p>
            </div>
            <span className="text-xs text-muted-foreground">{sortedStyles.length} resultado(s)</span>
          </div>

          {sortedStyles.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-4 text-center text-sm text-muted-foreground">
              {isModern
                ? "Nenhum serviço encontrado. Ajuste filtros ou crie um novo serviço."
                : "Nenhum serviço encontrado. Ajuste o olhar da casa ou crie um novo serviço."}
            </div>
          ) : (
            sortedStyles.map((style, idx) => {
              const metric = serviceMetrics(style, idx);
              const hasHighDemand = metric.bookings >= 18;
              const hasHighTicket = Number(style.price || 0) >= avgTicket && avgTicket > 0;
              const hasFastTurn = style.durationMinutes <= 30;
              const performanceBadges = [
                idx === 0 ? "Mais vendido" : null,
                hasHighDemand ? "Alta demanda" : null,
                hasHighTicket ? "Maior ticket" : null,
                hasFastTurn ? "Rápido giro" : null,
              ].filter(Boolean) as string[];
              const modernMetricLine = `${style.durationMinutes} min · ${metric.bookings} agendamentos/semana · R$ ${metric.revenue.toLocaleString("pt-BR")} resultado`;
              const vintageMetricLine = `${style.durationMinutes} min · ${metric.bookings} agendamentos/semana · R$ ${metric.revenue.toLocaleString("pt-BR")} faturados`;
              const modernInsight = idx === 0
                ? "Serviço com maior volume de agendamentos na semana."
                : hasHighDemand && hasHighTicket
                  ? "Boa conversão e ticket acima da média."
                  : hasFastTurn
                    ? "Bom desempenho para encaixes e recorrência."
                    : "Desempenho estável com potencial de crescimento.";
              const vintageBadge = idx === 0 ? "Assinatura da casa" : hasHighDemand ? "Escolha clássica" : "Acabamento premium";
              const vintageMicrocopy = style.description?.trim()
                ? style.description
                : "Serviço com acabamento cuidadoso e experiência refinada.";
              return (
                <div
                  key={style.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => openEditForm(style)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      openEditForm(style);
                    }
                  }}
                  className={cn(
                    "theme-surface w-full text-left flex items-center justify-between px-3 transition hover:-translate-y-0.5 hover:border-primary/35",
                    isModern ? "rounded-2xl py-3.5" : "rounded-xl py-3",
                    style.active === false ? "opacity-70" : "",
                  )}
                >
                  <div className={cn("flex items-center min-w-0", isModern ? "gap-3.5" : "gap-3")}>
                    <div className="w-1.5 h-10 rounded-full bg-primary/70" />
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground text-base truncate">{style.name}</p>
                      {isModern ? (
                        <>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">{modernMetricLine}</p>
                          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                            {performanceBadges.slice(0, 2).map((badge) => (
                              <span
                                key={badge}
                                className="inline-flex items-center rounded-full border border-primary/35 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary"
                              >
                                {badge}
                              </span>
                            ))}
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-1 truncate">{modernInsight}</p>
                        </>
                      ) : (
                        <>
                          <span className="inline-flex items-center rounded-full border border-primary/35 bg-gradient-to-r from-primary/25 to-primary/10 px-2.5 py-0.5 text-[10px] font-semibold tracking-wide text-primary-foreground mt-1">
                            ◆ {vintageBadge}
                          </span>
                          <p className="text-xs text-muted-foreground truncate mt-1">{vintageMetricLine}</p>
                          <p className="text-[11px] text-primary/85 truncate mt-1">{vintageMicrocopy}</p>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <span className="text-lg font-bold text-foreground">R$ {Number(style.price || 0).toFixed(2)}</span>
                    <Button size="xs" variant="outline" onClick={() => openEditForm(style)}>
                      <Pencil className={cn("w-3.5 h-3.5", isModern ? "stroke-[1.7]" : "stroke-[2]")} />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="xs" variant="ghost" className="px-2">
                          <MoreVertical className={cn("w-4 h-4", isModern ? "stroke-[1.7]" : "stroke-[2]")} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" sideOffset={4}>
                        <DropdownMenuItem onSelect={() => toggleStyleActive(style.id)}>
                          {style.active === false ? "Ativar" : "Desativar"}
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => duplicateStyle(style)}>
                          Duplicar
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => toast({ title: "Desempenho do serviço", description: `${style.name}: ${metric.bookings} agendamentos e R$ ${metric.revenue.toLocaleString("pt-BR")} faturados.` })}>
                          Ver desempenho
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => removeStyle(style.id)} className="text-destructive">
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })
          )}

          <div className={cn("rounded-2xl border p-4 sm:p-5", isModern ? "bg-card/70 border-border/60" : "bg-black/15 border-primary/25")}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className={cn("text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground", !isModern && "text-primary/70")}>
                  {isModern ? "Ações rápidas" : "Ajustes da casa"}
                </p>
                <p className={cn("text-xs text-muted-foreground mt-1", !isModern && "italic opacity-80")}>
                  {isModern ? "Atalhos para gestão do catálogo." : "Feche o ciclo: crie, ajuste e revise com clareza."}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs font-bold uppercase tracking-widest gap-2"
                onClick={() => {
                  setSearchQuery("");
                  setCategoryFilter("Todos");
                  setSortBy("house");
                }}
              >
                {isModern ? "Limpar" : "Voltar à ordem"}
              </Button>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant={isModern ? "outline" : "outlineGold"} size="sm" className="h-10 rounded-xl font-semibold" onClick={openNewServiceForm}>
                Criar novo serviço
              </Button>
              <Button variant={isModern ? "outline" : "outlineGold"} size="sm" className="h-10 rounded-xl font-semibold" onClick={openNewPackageForm}>
                Montar pacote
              </Button>
              <Button
                variant={isModern ? "outline" : "outlineGold"}
                size="sm"
                className="h-10 rounded-xl font-semibold"
                onClick={() => setSortBy("price_high")}
              >
                Revisar preços
              </Button>
              <Button
                variant={isModern ? "outline" : "outlineGold"}
                size="sm"
                className="h-10 rounded-xl font-semibold"
                onClick={() => setSortBy("low")}
              >
                Ver baixa saída
              </Button>
            </div>
          </div>
        </motion.div>
        )}
        </motion.div>
        )}

        {/* Pacotes com desconto */}
        {activeTab === "packages" && (
        <motion.div
          key="packages-tab-content"
          id="pacotes"
          initial={{ opacity: 0, x: 18 * tabDirection, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, x: -18 * tabDirection, y: -6 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="pt-2"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-4">
            <div className="min-w-0">
              <h2 className={cn("text-xl font-bold text-foreground flex items-center gap-2", isModern ? "font-display" : "font-vintage-display")}>
                <Package className={cn("w-5 h-5 text-primary shrink-0", isModern ? "stroke-[1.7]" : "stroke-[2.1]")} />
                Pacotes
              </h2>
              {!isModern && (
                <div className="mt-1.5 h-px w-32 max-w-full bg-gradient-to-r from-primary/65 via-primary/25 to-transparent" />
              )}
              <p className="text-sm text-muted-foreground mt-1">{packagesIntro}</p>
              {!isModern && (
                <p className="text-xs text-primary/85 mt-2 max-w-lg leading-relaxed">
                  Pacotes bem posicionados viram upgrade natural — o cliente sobe de serviço sem sensação de promoção genérica.
                </p>
              )}
            </div>
            <Button
              variant="outline"
              className={cn(
                "w-full sm:w-auto h-11 min-h-11 px-5 sm:px-6 text-sm font-semibold gap-2 [&_svg]:mr-0 transition-all",
                isModern
                  ? "duration-200 rounded-xl bg-primary text-primary-foreground border-primary/20 hover:bg-primary/95 hover:-translate-y-0.5 hover:shadow-[0_10px_26px_-18px_hsl(var(--primary)/0.9)]"
                  : "duration-150 rounded-lg border-primary/35 bg-primary/12 text-primary hover:bg-primary/18",
              )}
              onClick={openNewPackageForm}
            >
              <Plus className={cn("w-4 h-4 shrink-0", isModern ? "stroke-[1.7]" : "stroke-[2]")} /> Criar pacote
            </Button>
          </div>
          {packages.length === 0 ? (
            <div
              className={cn(
                "theme-surface text-center",
                isModern
                  ? "rounded-2xl border-white/10 bg-card/95 px-6 py-9 md:px-10 md:py-12"
                  : "rounded-xl border-primary/30 bg-card/95 px-6 py-7 md:px-8 md:py-8",
              )}
            >
              <div
                className={cn(
                  "mx-auto mb-4 flex items-center justify-center border",
                  isModern
                    ? "h-14 w-14 rounded-full border-primary/25 bg-primary/10 shadow-[0_0_28px_-14px_hsl(var(--primary)/0.9)]"
                    : "h-12 w-12 rounded-xl border-primary/35 bg-primary/12",
                )}
              >
                <Package className={cn("text-primary", isModern ? "h-5 w-5 stroke-[1.7]" : "h-5 w-5 stroke-[2.1]")} />
              </div>
              <h3 className={cn("text-base text-foreground", isModern ? "font-display font-bold" : "font-vintage-display font-semibold")}>
                Nenhum pacote criado ainda
              </h3>
              {!isModern && (
                <div className="mx-auto mt-2 h-px w-28 bg-gradient-to-r from-transparent via-primary/45 to-transparent" />
              )}
              <p className="mx-auto mt-1 max-w-xl text-sm text-muted-foreground">
                {emptyPackagesDescription}
              </p>
              <p className="mt-3 text-xs text-muted-foreground">{emptyPackagesAux}</p>
              <Button
                className={cn(
                  "mt-5 h-10 px-5 text-sm font-semibold transition-all",
                  isModern
                    ? "duration-200 rounded-xl bg-primary text-primary-foreground hover:bg-primary/95 hover:-translate-y-0.5 hover:shadow-[0_10px_24px_-16px_hsl(var(--primary)/0.9)]"
                    : "duration-150 rounded-lg bg-primary text-primary-foreground border border-primary/40 hover:bg-primary/90",
                )}
                onClick={openNewPackageForm}
              >
                <Plus className={cn("w-4 h-4 mr-1.5", isModern ? "stroke-[1.7]" : "stroke-[2]")} />
                Criar pacote
              </Button>
            </div>
          ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {packages.map((p) => {
              const isFeatured = topPackage != null && p.id === topPackage.id;
              return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={isModern ? { y: -2 } : { y: -1 }}
                transition={{ duration: isModern ? 0.2 : 0.15, ease: "easeOut" }}
                className={cn(
                  "glass-card px-3 sm:px-4 py-3 flex items-center gap-3 sm:gap-4 min-w-0 w-full",
                  isModern
                    ? "rounded-2xl border border-primary/40 bg-primary/5"
                    : cn(
                        "rounded-xl border border-primary/30 bg-gradient-to-b from-card via-card/98 to-card/90",
                        isFeatured && "shadow-[0_0_28px_hsl(var(--primary)/0.12)] ring-1 ring-primary/25",
                      ),
                )}
              >
                <div
                  className={cn(
                    "w-16 h-16 overflow-hidden flex items-center justify-center shrink-0",
                    isModern ? "rounded-lg bg-secondary" : "rounded-lg bg-secondary/80 border border-primary/20",
                  )}
                >
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <Package className={cn("w-6 h-6 text-primary/50", isModern ? "stroke-[1.7]" : "stroke-[2.1]")} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 gap-y-1">
                    <p className={cn("font-semibold text-foreground truncate", isModern ? "font-display" : "font-vintage-display")}>{p.name}</p>
                    {isFeatured && (
                      <span
                        className={cn(
                          "shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide",
                          isModern
                            ? "bg-primary/15 text-primary border border-primary/25"
                            : "border border-primary/35 bg-gradient-to-r from-primary/25 to-primary/10 text-primary-foreground",
                        )}
                      >
                        {isModern ? "Em alta" : "◆ Estrela da mesa"}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{p.description || "Oferta especial de pacote"}</p>
                  {!isModern && isFeatured && (
                    <p className="mt-1 text-[11px] text-primary/85 leading-snug">
                      O combo que mais ajuda a fechar o ticket sem parecer desconto vazio.
                    </p>
                  )}
                  <p className="text-sm text-primary font-semibold mt-1">
                    <span className="text-xs text-muted-foreground line-through mr-2">R$ {(p.basePrice ?? p.price).toFixed(2)}</span>
                    R$ {(p.finalPrice ?? p.price).toFixed(2)}
                  </p>
                  <p className="text-xs text-emerald-400 inline-flex items-center gap-1">
                    <Sparkles className={cn("w-3 h-3", isModern ? "stroke-[1.7]" : "stroke-[2]")} />
                    Economize R$ {(p.savingsValue ?? 0).toFixed(2)} ({p.discountPercent}%)
                  </p>
                  {p.validUntil && <p className="text-[11px] text-muted-foreground mt-1">Válido até {new Date(p.validUntil).toLocaleDateString("pt-BR")}</p>}
                </div>
                <div className="flex flex-col gap-1">
                  <button onClick={() => openEditPackage(p.id)} className="text-muted-foreground hover:text-foreground" title="Editar pacote">
                    <Pencil className={cn("w-4 h-4", isModern ? "stroke-[1.7]" : "stroke-[2]")} />
                  </button>
                  <button onClick={() => removePackage(p.id)} className="text-muted-foreground hover:text-destructive" title="Excluir pacote">
                    <Trash2 className={cn("w-4 h-4", isModern ? "stroke-[1.7]" : "stroke-[2]")} />
                  </button>
                </div>
              </motion.div>
            );
            })}
          </div>
          )}
        </motion.div>
        )}
        </AnimatePresence>
      </motion.div>
    </DashboardLayout>
  );
};

export default BarberServices;
