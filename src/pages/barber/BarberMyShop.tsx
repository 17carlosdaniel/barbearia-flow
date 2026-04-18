import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  Store,
  Save,
  Phone,
  MapPin,
  Calendar,
  User,
  Package,
  Zap,
  Globe,
  Clock,
  ImagePlus,
  FileText,
  Plus,
  Trash2,
  Gift,
  LayoutGrid,
  Sparkles,
  Wifi,
  Car,
  Snowflake,
  Coffee,
  Tv,
  CreditCard,
  Banknote,
  ExternalLink,
  Camera,
  Edit,
  Eye,
  Check,
  Circle,
  Loader2,
  Lightbulb,
  Users,
  Copy,
  MessageCircle,
  AlertCircle,
  Star,
  BarChart2,
  Pencil,
  Timer,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "@/hooks/use-toast";
import {
  getBarbershopProfile,
  setBarbershopProfile,
  type CnpjOption,
  type GalleryItem,
  type GalleryCategory,
} from "@/lib/barbershopProfile";
import {
  getOpeningHours,
  setOpeningHours,
  DAY_NAMES,
  type WeekSchedule,
  type DayOfWeek,
  type DaySchedule,
} from "@/lib/openingHours";
import { getBarberCatalog, setBarberCatalog } from "@/lib/barberCatalog";
import { getFirstVisitOfferRaw } from "@/lib/loyalty";
import { getCanonicalAppointmentsForBarbershop } from "@/lib/appointments";
import { getAverageRating } from "@/lib/reviews";
import { ESTADOS } from "@/lib/constants";
import { sanitizeBrazilPhoneDigits, formatBrazilPhoneBr, isBrazilPhoneComplete } from "@/lib/phoneBr";
import { IconTikTok, IconInstagram, IconFacebook } from "@/components/icons/SocialIcons";

const DAY_LABELS_SHORT: Record<number, string> = {
  0: "Domingo",
  1: "Segunda",
  2: "Terça",
  3: "Quarta",
  4: "Quinta",
  5: "Sexta",
  6: "Sábado",
};
type TabId = "dados" | "redes" | "horarios" | "fotos";

const TAB_CONFIG: {
  id: TabId;
  label: string;
  labelModern?: string;
  iconVintage: LucideIcon;
  iconModern: LucideIcon;
}[] = [
  { id: "dados", label: "Dados", iconVintage: Store, iconModern: LayoutGrid },
  { id: "redes", label: "Redes Sociais", labelModern: "Redes", iconVintage: Globe, iconModern: Globe },
  { id: "horarios", label: "Horários", iconVintage: Clock, iconModern: Clock },
  { id: "fotos", label: "Fotos", iconVintage: ImagePlus, iconModern: ImagePlus },
];

const containerVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.2 },
  },
};

const listVariants = {
  visible: { transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 4 },
  visible: { opacity: 1, y: 0 },
};

function BeforeAfterSlider({ beforeUrl, afterUrl, alt }: { beforeUrl: string; afterUrl: string; alt?: string }) {
  const [position, setPosition] = useState(50);
  return (
    <div className="relative w-full h-full bg-black">
      <img src={beforeUrl} alt={alt || "Antes"} className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}>
        <img src={afterUrl} alt={alt || "Depois"} className="absolute inset-0 w-full h-full object-cover" />
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={position}
        onChange={(e) => setPosition(Number(e.target.value))}
        className="absolute bottom-1 left-1 right-1 h-2 rounded-full appearance-none bg-white/30 accent-primary z-10"
      />
    </div>
  );
}

const BarberMyShop = () => {
  const { user } = useAuth();
  const { identity } = useTheme();
  const isModern = identity === "modern";
  const barbershopId = user?.barbershopId ?? 1;
  const profile = getBarbershopProfile(barbershopId);

  const [abaAtiva, setAbaAtiva] = useState<TabId>("dados");

  // Dados
  const [nomeBarbearia, setNomeBarbearia] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cidade, setCidade] = useState("");
  const [sobre, setSobre] = useState("");
  const [coverPhotoUrl, setCoverPhotoUrl] = useState("");
  const [cnpjOption, setCnpjOption] = useState<CnpjOption>("nao_tenho");
  const [cnpjValue, setCnpjValue] = useState("");
  const [estado, setEstado] = useState("");
  const [endereco, setEndereco] = useState("");
  const [desde, setDesde] = useState("");
  const [barberName, setBarberName] = useState("");
  const [precoMedio, setPrecoMedio] = useState("");
  const [tempoMedioMinutos, setTempoMedioMinutos] = useState(45);
  const [comodidades, setComodidades] = useState({
    wifi: false,
    estacionamento: false,
    arCondicionado: false,
    cafe: false,
    tv: false,
  });
  const [pagamentos, setPagamentos] = useState({
    pix: true,
    debito: false,
    credito: false,
    dinheiro: false,
  });
  const [bandeiras, setBandeiras] = useState({
    visa: false,
    mastercard: false,
    elo: false,
    amex: false,
  });

  // Redes
  const [instagram, setInstagram] = useState("");
  const [facebook, setFacebook] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [whatsapp, setWhatsapp] = useState("");

  // Horários
  const [schedule, setSchedule] = useState<WeekSchedule | null>(null);

  // Galeria
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [newPhotoUrl, setNewPhotoUrl] = useState("");
  const [newPhotoCaption, setNewPhotoCaption] = useState("");
  const [newPhotoType, setNewPhotoType] = useState<"corte" | "ambiente">("ambiente");
  const [newPhotoCategory, setNewPhotoCategory] = useState<GalleryCategory>("cortes");
  const [newPhotoTags, setNewPhotoTags] = useState("");
  const [galleryFilter, setGalleryFilter] = useState<GalleryCategory | "todos">("todos");
  const [editPhotoIndex, setEditPhotoIndex] = useState<number | null>(null);
  const [editPhotoCaption, setEditPhotoCaption] = useState("");
  const [editPhotoCategory, setEditPhotoCategory] = useState<GalleryCategory>("cortes");
  const [beforeAfterUrls, setBeforeAfterUrls] = useState({ before: "", after: "" });
  const [newPhotoKind, setNewPhotoKind] = useState<"single" | "antes-depois">("single");

  // Foto de capa (upload direto)
  const coverFileInputRef = useRef<HTMLInputElement>(null);
  const sobreTextareaRef = useRef<HTMLTextAreaElement>(null);
  const galleryFileInputRef = useRef<HTMLInputElement>(null);
  const beforeFileRef = useRef<HTMLInputElement>(null);
  const afterFileRef = useRef<HTMLInputElement>(null);

  const [saveDadosLoading, setSaveDadosLoading] = useState(false);
  const [saveDadosSuccess, setSaveDadosSuccess] = useState(false);
  const [saveRedesSuccess, setSaveRedesSuccess] = useState(false);
  const [saveHorariosSuccess, setSaveHorariosSuccess] = useState(false);
  const [presetHorariosRapido, setPresetHorariosRapido] = useState<"comercial" | "meio" | "almoco">("comercial");
  const [catalogRefreshKey, setCatalogRefreshKey] = useState(0);

  useEffect(() => {
    const p = getBarbershopProfile(barbershopId);
    setNomeBarbearia(p.nomeBarbearia ?? user?.name ?? "");
    setTelefone(sanitizeBrazilPhoneDigits(p.telefone ?? ""));
    setCidade(p.cidade ?? "");
    setSobre(p.sobre ?? "");
    setCoverPhotoUrl(p.coverPhotoUrl ?? "");
    setCnpjOption(p.cnpjOption);
    setCnpjValue(p.cnpjValue ?? "");
    setEstado(p.estado ?? "SP");
    setEndereco(p.endereco ?? "");
    setDesde(p.desde ?? "");
    setBarberName(p.barberName || user?.name || "");
    setPrecoMedio(p.precoMedio ?? "");
    setTempoMedioMinutos(p.tempoMedioMinutos ?? 45);
    setComodidades({
      wifi: !!p.comodidades?.wifi,
      estacionamento: !!p.comodidades?.estacionamento,
      arCondicionado: !!p.comodidades?.arCondicionado,
      cafe: !!p.comodidades?.cafe,
      tv: !!p.comodidades?.tv,
    });
    setPagamentos({
      pix: !!p.pagamentos?.pix,
      debito: !!p.pagamentos?.debito,
      credito: !!p.pagamentos?.credito,
      dinheiro: !!p.pagamentos?.dinheiro,
    });
    setBandeiras({
      visa: !!p.pagamentos?.bandeiras?.includes("Visa"),
      mastercard: !!p.pagamentos?.bandeiras?.includes("Mastercard"),
      elo: !!p.pagamentos?.bandeiras?.includes("Elo"),
      amex: !!p.pagamentos?.bandeiras?.includes("Amex"),
    });
    setInstagram(p.instagram ?? "");
    setFacebook(p.facebook ?? "");
    setTiktok(p.tiktok ?? "");
    setWhatsapp(p.telefone ?? p.outrasRedes ?? "");
    setGallery(p.gallery ?? []);
    setSchedule(getOpeningHours(barbershopId));
  }, [barbershopId, user?.name]);

  const handleSaveDados = (e: React.FormEvent) => {
    e.preventDefault();
    const phoneDigits = sanitizeBrazilPhoneDigits(telefone);
    if (phoneDigits.length > 0 && !isBrazilPhoneComplete(phoneDigits)) {
      toast({
        title: "Telefone incompleto",
        description: "Informe DDD + número (10 dígitos fixo ou 11 celular).",
        variant: "destructive",
      });
      return;
    }
    const phoneVal = phoneDigits.length >= 10 ? formatBrazilPhoneBr(phoneDigits) : "";
    setSaveDadosLoading(true);
    setSaveDadosSuccess(false);
    const selectedBandeiras = [
      bandeiras.visa ? "Visa" : null,
      bandeiras.mastercard ? "Mastercard" : null,
      bandeiras.elo ? "Elo" : null,
      bandeiras.amex ? "Amex" : null,
    ].filter(Boolean) as string[];
    setBarbershopProfile(barbershopId, {
      nomeBarbearia: nomeBarbearia.trim() || undefined,
      telefone: phoneVal || "",
      cidade: cidade.trim() || undefined,
      estado: estado?.trim() || "SP",
      endereco: endereco.trim() || "",
      sobre: sobre.trim() || "",
      coverPhotoUrl: coverPhotoUrl.trim() || undefined,
      cnpjOption,
      cnpjValue: cnpjOption === "sim" ? cnpjValue : "",
      desde: desde || undefined,
      barberName: barberName.trim() || undefined,
      precoMedio: precoMedio.trim() || "",
      tempoMedioMinutos: Number.isFinite(tempoMedioMinutos) ? tempoMedioMinutos : 45,
      comodidades,
      pagamentos: {
        ...pagamentos,
        bandeiras: selectedBandeiras,
      },
    });
    setSaveDadosLoading(false);
    setSaveDadosSuccess(true);
    window.setTimeout(() => setSaveDadosSuccess(false), 2500);
    toast({ title: "Dados atualizados", description: "Suas informações foram salvas com sucesso." });
  };

  const handleSaveRedes = (e: React.FormEvent) => {
    e.preventDefault();
    const insta = maskHandle(instagram);
    const tktk = maskHandle(tiktok);
    const face = maskFacebook(facebook);
    const whats = maskWhatsapp(whatsapp);
    setInstagram(insta);
    setTiktok(tktk);
    setFacebook(face);
    setWhatsapp(whats);
    const telDigitsRedes = sanitizeBrazilPhoneDigits(telefone);
    setBarbershopProfile(barbershopId, {
      instagram: insta.trim() || "",
      facebook: face.trim() || "",
      tiktok: tktk.trim() || "",
      telefone: whats.trim() || (telDigitsRedes.length >= 10 ? formatBrazilPhoneBr(telDigitsRedes) : "") || "",
      outrasRedes: whats.trim() || "",
    });
    setSaveRedesSuccess(true);
    window.setTimeout(() => setSaveRedesSuccess(false), 2500);
    toast({ title: "Redes atualizadas", description: "Como os clientes entram em contato com você foi salvo." });
  };

  const whatsappNumber = (whatsapp || telefone || "").replace(/\D/g, "");
  const whatsappLink = whatsappNumber.length >= 10
    ? `https://wa.me/55${whatsappNumber}`
    : null;
  const openWhatsAppTest = () => {
    if (!whatsappLink) {
      toast({ title: "Configure o WhatsApp", description: "Informe o número para testar.", variant: "destructive" });
      return;
    }
    window.open(whatsappLink, "_blank");
  };
  const copyToClipboard = (text: string, label: string) => {
    if (!text.trim()) {
      toast({ title: `${label} vazio`, variant: "destructive" });
      return;
    }
    navigator.clipboard.writeText(text.trim()).then(
      () => toast({ title: "Link copiado", description: `${label} copiado para a área de transferência.` }),
      () => toast({ title: "Erro ao copiar", variant: "destructive" }),
    );
  };
  const openInstagram = () => {
    const u = instagram.trim().replace(/^@/, "");
    if (!u) {
      toast({ title: "Informe seu @ do Instagram", variant: "destructive" });
      return;
    }
    window.open(`https://instagram.com/${u}`, "_blank");
  };
  const openTiktok = () => {
    const u = tiktok.trim().replace(/^@/, "");
    if (!u) {
      toast({ title: "Informe seu @ do TikTok", variant: "destructive" });
      return;
    }
    window.open(`https://tiktok.com/@${u}`, "_blank");
  };
  const maskWhatsapp = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };
  const maskHandle = (value: string) => {
    const clean = value.replace(/\s+/g, "").replace(/@+/g, "").replace(/[^a-zA-Z0-9._]/g, "");
    return clean ? `@${clean.toLowerCase()}` : "";
  };
  const maskFacebook = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return "";
    const normalized = trimmed
      .replace(/^https?:\/\//i, "")
      .replace(/^www\./i, "")
      .replace(/^facebook\.com\//i, "")
      .replace(/^@+/, "")
      .replace(/\s+/g, "");
    return normalized ? `facebook.com/${normalized}` : "";
  };

  const timeToMinutes = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return (h ?? 0) * 60 + (m ?? 0);
  };
  const slotMinutes = (slot: DaySchedule) => {
    const m1 = timeToMinutes(slot.close) - timeToMinutes(slot.open);
    if (slot.open2 && slot.close2) return m1 + (timeToMinutes(slot.close2) - timeToMinutes(slot.open2));
    return m1;
  };

  const handleSaveHorarios = (e: React.FormEvent) => {
    e.preventDefault();
    if (schedule) {
      setOpeningHours(barbershopId, schedule);
      setSaveHorariosSuccess(true);
      window.setTimeout(() => setSaveHorariosSuccess(false), 2500);
      toast({ title: "Horários atualizados", description: "Clientes verão essas informações." });
    }
  };

  const toggleDay = (day: DayOfWeek, open: boolean) => {
    if (!schedule) return;
    const next = { ...schedule };
    next[day] = open ? { open: "09:00", close: "19:00" } : null;
    setSchedule(next);
  };

  const updateDayTime = (day: DayOfWeek, field: "open" | "close" | "open2" | "close2", value: string) => {
    if (!schedule || !schedule[day]) return;
    const next = { ...schedule };
    const s = { ...next[day]! };
    (s as Record<string, string>)[field] = value;
    next[day] = s;
    setSchedule(next);
  };

  const applyToAllDays = (template: DaySchedule | null) => {
    if (!schedule) return;
    const next: WeekSchedule = { 0: null, 1: null, 2: null, 3: null, 4: null, 5: null, 6: null };
    (DAY_NAMES as { value: DayOfWeek }[]).forEach(({ value: d }) => {
      next[d] = template ? { ...template } : null;
    });
    setSchedule(next);
    toast({
      title: "Aplicado",
      description: template
        ? "Mesmo horário em todos os dias."
        : "Todos os dias marcados como fechados.",
    });
  };

  const applyTemplate = (name: "comercial" | "meio" | "almoco") => {
    const templates: Record<string, DaySchedule> = {
      comercial: { open: "09:00", close: "18:00" },
      meio: { open: "09:00", close: "13:00" },
      almoco: { open: "09:00", close: "12:00", open2: "13:00", close2: "18:00" },
    };
    const t = templates[name];
    if (!schedule) return;
    const next: WeekSchedule = { ...schedule };
    (DAY_NAMES as { value: DayOfWeek }[]).forEach(({ value: d }) => {
      if (d === 0) next[0] = null;
      else next[d] = { ...t };
    });
    setSchedule(next);
    setPresetHorariosRapido(name);
    toast({
      title: "Template aplicado",
      description: name === "comercial"
        ? "Comercial 09h–18h"
        : name === "meio"
          ? "Meio período 09h–13h"
          : "Com intervalo de almoço.",
    });
  };

  const chipHorarioRapidoClass = (id: "comercial" | "meio" | "almoco") =>
    presetHorariosRapido === id
      ? isModern
        ? "rounded-md border border-primary bg-primary/10 px-3 py-2 text-sm font-medium text-primary transition-colors duration-150"
        : "rounded-lg border border-primary/50 bg-primary/10 px-3 py-2 text-sm font-medium text-primary"
      : isModern
        ? "rounded-md border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors duration-150"
        : "rounded-lg border border-border bg-secondary/50 px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary";

  const copyDayTo = (fromDay: DayOfWeek, toDay: DayOfWeek) => {
    if (!schedule || !schedule[fromDay]) return;
    const next = { ...schedule };
    next[toDay] = { ...schedule[fromDay]! };
    setSchedule(next);
    toast({ title: "Copiado", description: `${DAY_LABELS_SHORT[fromDay]} → ${DAY_LABELS_SHORT[toDay]}` });
  };

  const toggleLunch = (day: DayOfWeek, hasLunch: boolean) => {
    if (!schedule || !schedule[day]) return;
    const next = { ...schedule };
    const s = { ...next[day]! };
    if (hasLunch) {
      s.close = "12:00";
      s.open2 = "13:00";
      s.close2 = s.close2 || "18:00";
    } else {
      s.close = s.close2 || "18:00";
      delete s.open2;
      delete s.close2;
    }
    next[day] = s;
    setSchedule(next);
  };

  const validateSlot = (slot: DaySchedule): string | null => {
    const o = timeToMinutes(slot.open);
    const c = timeToMinutes(slot.close);
    if (c <= o) return "Horário inválido (fechar após abrir)";
    if (slot.open2 != null && slot.close2 != null) {
      const o2 = timeToMinutes(slot.open2);
      const c2 = timeToMinutes(slot.close2);
      if (c2 <= o2) return "Intervalo inválido";
      if (o2 <= c) return "Intervalo de almoço deve ser após o fechamento da manhã";
    }
    const total = slotMinutes(slot);
    if (total < 60) return "Horário muito curto (mín. 1h)";
    return null;
  };

  const GALLERY_CATEGORIES: { value: GalleryCategory; label: string }[] = [
    { value: "cortes", label: "Cortes" },
    { value: "barba", label: "Barba" },
    { value: "degrade", label: "Degradê" },
    { value: "infantil", label: "Infantil" },
    { value: "ambiente", label: "Ambiente" },
    { value: "equipe", label: "Equipe" },
    { value: "antes-depois", label: "Antes/Depois" },
  ];

  const addPhoto = () => {
    if (newPhotoKind === "antes-depois") {
      if (!beforeAfterUrls.before.trim() || !beforeAfterUrls.after.trim()) {
        toast({ title: "Informe as duas imagens (antes e depois)", variant: "destructive" });
        return;
      }
      const next: GalleryItem[] = [...gallery, {
        url: beforeAfterUrls.after.trim(),
        caption: newPhotoCaption.trim(),
        category: "antes-depois",
        type: "corte",
        beforeAfter: { beforeUrl: beforeAfterUrls.before.trim(), afterUrl: beforeAfterUrls.after.trim() },
        createdAt: new Date().toISOString(),
        viewCount: 0,
        clickCount: 0,
      }];
      setGallery(next);
      setBarbershopProfile(barbershopId, { gallery: next });
      setBeforeAfterUrls({ before: "", after: "" });
      setNewPhotoCaption("");
      setNewPhotoKind("single");
      toast({ title: "Antes/Depois adicionado", description: "Essa foto converte muito!" });
      return;
    }
    if (!newPhotoUrl.trim()) {
      toast({ title: "Informe a URL da imagem ou escolha um arquivo", variant: "destructive" });
      return;
    }
    const tags = newPhotoTags.trim() ? newPhotoTags.split(/[\s,#]+/).filter(Boolean).slice(0, 5) : undefined;
    const item: GalleryItem = {
      url: newPhotoUrl.trim(),
      caption: newPhotoCaption.trim(),
      type: newPhotoCategory === "ambiente" ? "ambiente" : "corte",
      category: newPhotoCategory,
      tags,
      createdAt: new Date().toISOString(),
      viewCount: Math.floor(Math.random() * 80) + 10,
      clickCount: Math.floor(Math.random() * 15) + 1,
    };
    const next = [...gallery, item];
    setGallery(next);
    setBarbershopProfile(barbershopId, { gallery: next });
    setNewPhotoUrl("");
    setNewPhotoCaption("");
    setNewPhotoTags("");
    setNewPhotoCategory("cortes");
    toast({ title: "Foto adicionada", description: "Ela já pode atrair novos clientes." });
  };

  const removePhoto = (index: number) => {
    const next = gallery.filter((_, i) => i !== index);
    setGallery(next);
    setBarbershopProfile(barbershopId, { gallery: next });
    setEditPhotoIndex(null);
    toast({ title: "Foto removida" });
  };

  const setPhotoHighlight = (index: number, value: boolean) => {
    const next = gallery.map((p, i) => (i === index ? { ...p, isHighlight: value } : p));
    setGallery(next);
    setBarbershopProfile(barbershopId, { gallery: next });
    toast({ title: value ? "Foto em destaque" : "Destaque removido" });
  };

  const updatePhotoMeta = (index: number, updates: { caption?: string; category?: GalleryCategory }) => {
    const next = gallery.map((p, i) => i === index ? { ...p, ...updates } : p);
    setGallery(next);
    setBarbershopProfile(barbershopId, { gallery: next });
    setEditPhotoIndex(null);
    toast({ title: "Foto atualizada" });
  };

  const getPhotoCategory = (p: GalleryItem): GalleryCategory => {
    if (p.category) return p.category;
    return p.type === "ambiente" ? "ambiente" : "cortes";
  };

  const filteredGallery = galleryFilter === "todos"
    ? gallery
    : gallery.filter((p) => getPhotoCategory(p) === galleryFilter);

  const triggerCoverUpload = () => {
    coverFileInputRef.current?.click();
  };

  const focusSobreField = () => {
    setAbaAtiva("dados");
    window.setTimeout(() => {
      sobreTextareaRef.current?.focus();
      sobreTextareaRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 280);
  };

  const handleCoverFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) {
      toast({ title: "Selecione uma imagem", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setCoverPhotoUrl(dataUrl);
      setBarbershopProfile(barbershopId, { coverPhotoUrl: dataUrl });
      toast({ title: "Foto de capa atualizada" });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const openAddressInMap = () => {
    const query = [endereco.trim(), cidade.trim(), estado.trim()].filter(Boolean).join(", ");
    if (!query) {
      toast({
        title: "Informe o endereço",
        description: "Preencha endereço, cidade e estado para visualizar no mapa.",
        variant: "destructive",
      });
      return;
    }
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`, "_blank");
  };

  void catalogRefreshKey;
  const catalog = getBarberCatalog(barbershopId);

  const offer = getFirstVisitOfferRaw(barbershopId);
  const appointments = getCanonicalAppointmentsForBarbershop(barbershopId);
  const { average: ratingAverage, count: ratingCount } = getAverageRating(barbershopId);

  const displayName = nomeBarbearia.trim() || user?.name || "Minha Barbearia";
  const displayLocation = [cidade.trim(), estado].filter(Boolean).join(", ") || "Sua cidade, SP";

  const checklist = {
    nome: !!nomeBarbearia.trim(),
    telefone: isBrazilPhoneComplete(telefone),
    foto: !!coverPhotoUrl.trim(),
    descricao: !!sobre.trim(),
    servicos: catalog.services.length > 0,
  };
  const completedCount = [
    checklist.nome,
    checklist.telefone,
    checklist.foto,
    checklist.descricao,
    checklist.servicos,
  ].filter(Boolean).length;
  const profileCompletePercent = Math.round((completedCount / 5) * 100);

  const profileChecklistRows = [
    {
      key: "nome" as const,
      done: checklist.nome,
      labelV: "Seu nome aparece nas buscas",
      hintV: "Ajuda clientes a te encontrarem",
      labelM: "Nome visível nas buscas",
      hintM: "Fundamental para buscas",
    },
    {
      key: "telefone",
      done: checklist.telefone,
      labelV: "Telefone para contato rápido",
      hintV: "Facilita agendamento pelo WhatsApp",
      labelM: "Telefone para contato",
      hintM: "WhatsApp e ligações",
    },
    {
      key: "foto",
      done: checklist.foto,
      labelV: "Uma boa foto de capa",
      hintV: "Quem tem foto costuma receber mais agendamentos",
      labelM: "Foto de capa",
      hintM: "Aumenta conversão do perfil",
    },
    {
      key: "descricao",
      done: checklist.descricao,
      labelV: "Descrição que apresenta sua barbearia",
      hintV: "Ajuda o cliente a escolher você com confiança",
      labelM: "Descrição do negócio",
      hintM: "Em poucas palavras",
    },
    {
      key: "servicos",
      done: checklist.servicos,
      labelV: "Serviços e preços claros",
      hintV: "Menos dúvida, mais conversão",
      labelM: "Serviços e preços",
      hintM: "Catálogo visível ao cliente",
    },
  ];

  const metrics = {
    visualizacoes: 120 + Math.floor(appointments.length * 2.5),
    agendamentos: appointments.filter((a) => a.status === "completed").length +
      appointments.filter((a) =>
        a.status === "scheduled" || a.status === "confirmed" || a.status === "in_service"
      ).length,
    avaliacao: ratingCount > 0 ? ratingAverage : 4.8,
  };

  const tempoMedioFromServices = catalog.services.length
    ? Math.round(catalog.services.reduce((s, sv) => s + (sv.durationMinutes || 30), 0) / catalog.services.length)
    : null;

  if (!user) return null;

  return (
    <DashboardLayout userType="barbeiro">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="space-y-6 max-w-4xl"
      >
        {/* Métricas */}
        <motion.div
          initial={{ opacity: 0, y: isModern ? 6 : 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: isModern ? 0.18 : 0.3 }}
          className="grid grid-cols-3 gap-3"
        >
          {(isModern
            ? [
                {
                  key: "v",
                  Icon: Eye,
                  num: metrics.visualizacoes,
                  line: "Visualizações",
                  sub: "Pessoas viram seu perfil",
                },
                {
                  key: "a",
                  Icon: Calendar,
                  num: metrics.agendamentos,
                  line: "Agendamentos",
                  sub: "Na agenda e concluídos",
                },
                {
                  key: "r",
                  Icon: Star,
                  num: metrics.avaliacao.toFixed(1),
                  line: "Avaliação média",
                  sub: ratingCount > 0
                    ? `${ratingCount} ${ratingCount === 1 ? "avaliação" : "avaliações"}`
                    : "Ainda sem notas",
                },
              ]
            : [
                {
                  key: "v",
                  value: metrics.visualizacoes,
                  caption: `${metrics.visualizacoes} ${metrics.visualizacoes === 1 ? "pessoa viu" : "pessoas viram"} seu perfil`,
                  icon: Eye,
                  iconClass: "text-primary",
                },
                {
                  key: "a",
                  value: metrics.agendamentos,
                  caption: `${metrics.agendamentos} ${metrics.agendamentos === 1 ? "cliente agendou" : "clientes agendaram"}`,
                  icon: Calendar,
                  iconClass: "text-primary",
                },
                {
                  key: "r",
                  value: `${metrics.avaliacao.toFixed(1)} ★`,
                  caption: "Média dos clientes",
                  icon: Sparkles,
                  iconClass: "text-amber-500",
                },
              ]
          ).map((metric, i) =>
            isModern && "line" in metric ? (
              <motion.div
                key={metric.key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.04 * i, duration: 0.2 }}
                whileHover={{ y: -1 }}
                className="rounded-xl border border-border bg-card p-3 sm:p-4 flex flex-col gap-2 min-w-0"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-2xl sm:text-3xl font-bold tabular-nums text-foreground leading-none
                    tracking-tight">
                    {metric.num}
                  </p>
                  <metric.Icon className="w-5 h-5 text-primary shrink-0 opacity-90" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">{metric.line}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{metric.sub}</p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key={metric.key}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * i, type: "spring", stiffness: 200, damping: 20 }}
                whileHover={{ scale: 1.03, y: -2 }}
                className="glass-card rounded-xl p-3 flex items-center gap-3
                  shadow-[0_0_24px_-16px_hsl(var(--primary)/0.15)]"
              >
                <motion.div
                  className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center"
                  whileHover={{ scale: 1.1 }}
                >
                  {(() => {
                    const m = metric as {
                      icon: LucideIcon;
                      iconClass: string;
                      value: string | number;
                      caption: string;
                    };
                    return <m.icon className={`w-4 h-4 ${m.iconClass}`} />;
                  })()}
                </motion.div>
                <div className="min-w-0">
                  {(() => {
                    const m = metric as { value: string | number; caption: string };
                    return (
                      <>
                        <p className="text-base sm:text-lg font-display font-bold text-foreground leading-tight">
                          {m.value}
                        </p>
                        <p className="text-[11px] sm:text-xs text-muted-foreground leading-snug mt-0.5">{m.caption}</p>
                      </>
                    );
                  })()}
                </div>
              </motion.div>
            ),
          )}
        </motion.div>

        {/* Seu perfil público — upgrade estratégico / score (modern) */}
        <motion.section
          initial={{ opacity: 0, y: isModern ? 6 : 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={
            isModern
              ? { delay: 0.06, duration: 0.2 }
              : { delay: 0.08, type: "spring", stiffness: 180, damping: 22 }
          }
          className={
            isModern
              ? "rounded-xl border border-border bg-card p-4"
              : "rounded-2xl border border-border/60 bg-card/80 p-4"
          }
        >
          <div className="mb-3">
            {isModern ? (
              <>
                <div className="flex items-baseline justify-between gap-2 flex-wrap">
                  <h2 className="text-sm font-semibold text-foreground tracking-tight">Score do perfil</h2>
                  <span className="text-xl font-bold tabular-nums text-foreground">{profileCompletePercent}/100</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {profileCompletePercent < 100
                    ? "Complete seu perfil para aumentar seus agendamentos"
                    : "Perfil no nível máximo — bom trabalho"}
                </p>
              </>
            ) : (
              <>
                <h2 className="text-sm font-semibold text-foreground">
                  Seu perfil pode atrair mais clientes
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {profileCompletePercent < 100
                    ? `Seu perfil está ${profileCompletePercent}% completo`
                    : "Perfil completo — você está em destaque nas buscas"}
                </p>
                {profileCompletePercent >= 40 && profileCompletePercent < 100 && (
                  <p className="text-[11px] text-primary/90 font-medium mt-1">
                    Falta pouco para destacar sua barbearia
                  </p>
                )}
              </>
            )}
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-secondary mb-4">
            <motion.div
              className={
                isModern
                  ? "h-full rounded-full bg-gradient-to-r from-[hsl(217_91%_55%)] to-[hsl(262_83%_58%)]"
                  : "h-full rounded-full bg-gradient-to-r from-primary/90 to-primary"
              }
              initial={{ width: 0 }}
              animate={{ width: `${profileCompletePercent}%` }}
              transition={{
                duration: isModern ? 0.45 : 0.85,
                ease: isModern ? [0.4, 0, 0.2, 1] : [0.22, 1, 0.36, 1],
                delay: isModern ? 0.05 : 0.12,
              }}
            />
          </div>

          {/* Checklist com impacto */}
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-sm mb-4">
            {profileChecklistRows.map((item, i) => (
              <motion.li
                key={item.key}
                initial={{ opacity: 0, x: isModern ? -4 : -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: isModern ? 0.04 * (i + 1) : 0.08 * (i + 1) }}
                whileHover={isModern ? { x: 0 } : { x: 4 }}
                className={`flex items-start gap-2 text-xs rounded-lg px-2.5 py-2 transition-colors ${
                  item.done
                    ? "bg-emerald-500/10"
                    : isModern
                      ? "bg-muted/40 border border-border/80 hover:bg-muted/55"
                      : "bg-amber-500/8 hover:bg-amber-500/15"
                }`}
              >
                {item.done ? (
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className={`w-4 h-4 shrink-0 mt-0.5 ${isModern ? "text-primary" : "text-amber-500"}`} strokeWidth={isModern ? 1.7 : 2} />
                )}
                <div className="flex-1 min-w-0">
                  <div className={`font-medium ${item.done ? "text-foreground" : "text-muted-foreground"}`}>
                    {isModern ? item.labelM : item.labelV}
                  </div>
                  {(isModern ? item.hintM : item.hintV) ? (
                    <div
                      className={`text-[10px] mt-0.5 ${
                        item.done ? "text-emerald-500/80" : isModern ? "text-muted-foreground" : "text-amber-500/70"
                      }`}
                    >
                      {isModern ? item.hintM : item.hintV}
                    </div>
                  ) : null}
                  {isModern && !item.done && item.key === "foto" && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-2 h-8 text-xs border-border"
                      onClick={triggerCoverUpload}
                    >
                      <Camera className="w-3.5 h-3.5 mr-1.5" />
                      Adicionar foto
                    </Button>
                  )}
                  {isModern && !item.done && item.key === "descricao" && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-2 h-8 text-xs border-border"
                      onClick={focusSobreField}
                    >
                      <Pencil className="w-3.5 h-3.5 mr-1.5" />
                      Escrever descrição
                    </Button>
                  )}
                  {isModern && !item.done && item.key === "servicos" && (
                    <Link to="/barbeiro/servicos" className="inline-flex mt-2 max-w-full">
                      <Button type="button" variant="outline" size="sm" className="h-8 text-xs border-border">
                        <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                        Cadastrar serviços
                      </Button>
                    </Link>
                  )}
                </div>
              </motion.li>
            ))}
          </ul>

          {/* Performance insights */}
          {profileCompletePercent >= 60 && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: isModern ? 0.2 : 0.5, duration: isModern ? 0.2 : undefined }}
              className={
                isModern
                  ? "rounded-lg border border-border bg-muted/25 p-3 space-y-2"
                  : "rounded-lg border border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-orange-500/10 p-3 space-y-2"
              }
            >
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <TrendingUp className={`w-4 h-4 ${isModern ? "text-primary" : "text-amber-500"}`} strokeWidth={isModern ? 1.7 : 2} />
                {isModern ? "Resumo de performance" : "Performance do seu perfil"}
              </div>
              <div className="space-y-1.5 text-xs text-muted-foreground">
                <div className="flex justify-between gap-2">
                  <span className="inline-flex items-center gap-1">
                    {ratingCount > 0 ? (
                      "Média dos clientes"
                    ) : (
                      <>
                        <BarChart2 className="w-3.5 h-3.5 shrink-0" />
                        Visualizações do perfil
                      </>
                    )}
                  </span>
                  <span className={`font-medium shrink-0 tabular-nums ${isModern ? "text-foreground" : "text-amber-400"}`}>
                    {ratingCount > 0 ? `${ratingAverage.toFixed(1)}/5 (${ratingCount})` : `${metrics.visualizacoes}`}
                  </span>
                </div>
                {coverPhotoUrl && (
                  <div className="flex justify-between gap-2">
                    <span className="inline-flex items-center gap-1">
                      <Camera className="w-3.5 h-3.5 shrink-0" />
                      Foto de capa
                    </span>
                    <span className={isModern ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-emerald-400 font-medium"}>
                      Ativa
                    </span>
                  </div>
                )}
                {sobre.trim() && (
                  <div className="flex justify-between gap-2">
                    <span className="inline-flex items-center gap-1">
                      <Edit className="w-3.5 h-3.5 shrink-0" />
                      Descrição
                    </span>
                    <span className={isModern ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-emerald-400 font-medium"}>
                      Publicada
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {profileCompletePercent < 100 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: isModern ? 0.25 : 0.6 }}
              className="mt-3 text-xs text-muted-foreground flex items-center gap-1.5"
            >
              <Lightbulb className={`w-3.5 h-3.5 shrink-0 ${isModern ? "text-primary" : "text-amber-500"}`} strokeWidth={isModern ? 1.7 : 2} />
              {isModern
                ? "Cada item completo melhora busca e conversão."
                : "Perfis completos recebem mais agendamentos. Complete os itens para aparecer melhor nas buscas."}
            </motion.p>
          )}
        </motion.section>

        {/* Banner de capa — destaque */}
        <motion.section
          initial={{ opacity: 0, y: isModern ? 6 : 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={
            isModern
              ? { delay: 0.1, duration: 0.2 }
              : { delay: 0.15, type: "spring", stiffness: 180, damping: 22 }
          }
          className={`relative overflow-hidden bg-card ${
            isModern ? "rounded-xl border border-border" : "rounded-2xl border-2 border-border/60"
          }`}
        >
          <a
            href={`/cliente/barbearia/${barbershopId}`}
            target="_blank"
            rel="noopener noreferrer"
            className={
              isModern
                ? "absolute top-3 right-3 z-10 inline-flex items-center gap-1.5 rounded-md border border-border bg-card/95 px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                : "absolute top-3 right-3 z-10 inline-flex items-center gap-1.5 rounded-lg bg-black/50 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-black/70 transition-colors"
            }
          >
            Ver perfil público
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <motion.button
            type="button"
            onClick={triggerCoverUpload}
            className={`block w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary overflow-hidden ${
              isModern ? "rounded-xl" : "rounded-2xl"
            }`}
            whileHover={isModern ? { scale: 1.005 } : { scale: 1.01 }}
            transition={isModern ? { duration: 0.15 } : { type: "spring", stiffness: 300, damping: 25 }}
          >
            <div className="aspect-[2.5/1] sm:aspect-[3/1] relative bg-muted/30">
              {coverPhotoUrl ? (
                <>
                  <motion.img
                    src={coverPhotoUrl}
                    alt="Capa da barbearia"
                    className="w-full h-full object-cover"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: isModern ? 0.2 : 0.3 }}
                  />
                  <div className="absolute inset-0 bg-black/20 hover:bg-black/10 transition-colors" />
                </>
              ) : isModern ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 border border-dashed border-border bg-muted/20 hover:bg-muted/35 transition-colors px-4">
                  <ImagePlus className="w-10 h-10 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground text-center max-w-md">
                    Adicione uma foto para aumentar a conversão do seu perfil
                  </span>
                  <span className="inline-flex items-center rounded-md border border-border bg-card/80 px-3 py-1.5 text-xs font-medium text-foreground">
                    Adicionar foto — clique na área
                  </span>
                </div>
              ) : (
                <motion.div
                  className="absolute inset-0 flex flex-col items-center justify-center gap-3 border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-colors"
                  whileHover={{ scale: 1.02 }}
                >
                  <motion.div
                    animate={{ y: [0, -4, 0] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                  >
                    <ImagePlus className="w-12 h-12 text-muted-foreground" />
                  </motion.div>
                  <span className="text-sm font-medium text-foreground">Adicione uma foto e aumente seus agendamentos</span>
                  <span className="text-xs text-muted-foreground max-w-xs text-center">
                    Quem usa foto de capa costuma receber bem mais reservas
                  </span>
                </motion.div>
              )}
            </div>
          </motion.button>
          <div
            className={
              isModern
                ? "absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent pointer-events-none"
                : "absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent pointer-events-none"
            }
          >
            <h1
              className={
                isModern
                  ? "text-lg sm:text-xl font-semibold text-white truncate tracking-tight"
                  : "text-xl sm:text-2xl font-display font-bold text-white truncate"
              }
            >
              {displayName}
            </h1>
            <p className="text-sm text-white/80">{displayLocation}</p>
          </div>
        </motion.section>
        <input
          ref={coverFileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleCoverFileChange}
        />

        {/* Tabs: modern = sublinhado simples; vintage = pill + glow */}
        {isModern ? (
          <div className="flex flex-wrap gap-0 border-b border-border overflow-x-auto">
            {TAB_CONFIG.map((tab) => {
              const Icon = tab.iconModern;
              const active = abaAtiva === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setAbaAtiva(tab.id)}
                  className={`relative flex items-center gap-2 px-3 sm:px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors duration-150 border-b-2 -mb-px rounded-none bg-transparent ${
                    active
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0 opacity-90" />
                  {tab.labelModern ?? tab.label}
                </button>
              );
            })}
          </div>
        ) : (
          <LayoutGroup id="barber-myshop-tabs">
            <div className="flex flex-wrap gap-1 p-1 rounded-xl bg-card border border-border/50 overflow-x-auto shadow-[inset_0_1px_0_0_hsl(var(--border)/0.5)]">
              {TAB_CONFIG.map((tab) => {
                const Icon = tab.iconVintage;
                const active = abaAtiva === tab.id;
                return (
                  <motion.button
                    key={tab.id}
                    type="button"
                    whileHover={{ scale: 1.03, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setAbaAtiva(tab.id)}
                    className={`relative flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                      active
                        ? "bg-primary/12 text-primary shadow-[0_0_24px_-10px_hsl(var(--primary)/0.45),inset_0_0_0_1px_hsl(var(--primary)/0.2)]"
                        : "text-muted-foreground hover:text-foreground hover:bg-primary/6"
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="barber-shop-tab-glow"
                        className="absolute inset-0 rounded-lg bg-primary/[0.06] pointer-events-none"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                    <Icon className={`w-4 h-4 shrink-0 relative z-10 ${active ? "drop-shadow-[0_0_8px_hsl(var(--primary)/0.35)]" : ""}`} />
                    <span className="relative z-10">{tab.label}</span>
                    {active && (
                      <motion.span
                        layoutId="barber-shop-tab-underline"
                        className="absolute bottom-1 left-3 right-3 h-0.5 rounded-full bg-primary z-20"
                        transition={{ type: "spring", stiffness: 400, damping: 35 }}
                      />
                    )}
                  </motion.button>
                );
              })}
            </div>
          </LayoutGroup>
        )}

        {/* Tab content */}
        <AnimatePresence mode="wait">
          {abaAtiva === "dados" && (
            <motion.div
              key="dados"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: isModern ? 0.12 : 0.2 }}
              className={
                isModern
                  ? "bg-card border border-border rounded-xl p-5 sm:p-6 shadow-sm space-y-6"
                  : "bg-card border border-border/50 rounded-2xl p-6 shadow-lg space-y-6"
              }
            >
              <div className="pb-2 border-b border-border/60">
                <h2
                  className={
                    isModern
                      ? "text-lg font-semibold text-foreground tracking-tight flex items-center gap-2"
                      : "text-xl font-display font-bold text-foreground flex items-center gap-2"
                  }
                >
                  <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-primary shrink-0" strokeWidth={isModern ? 1.7 : 2} />
                  {isModern ? "Dados do estabelecimento" : "Informações do Estabelecimento"}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {isModern
                    ? "O que o cliente vê no perfil. Campos objetivos convertem melhor."
                    : "O que aparece no seu perfil público. Quanto mais claro, mais clientes confiam e agendam."}
                </p>
              </div>

              {profileCompletePercent < 100 && (
                <div
                  className={
                    isModern
                      ? "rounded-lg border border-border bg-muted/30 p-3 flex items-start gap-2"
                      : "rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 flex items-start gap-2"
                  }
                >
                  <Lightbulb className={`w-5 h-5 shrink-0 mt-0.5 ${isModern ? "text-primary" : "text-amber-500"}`} strokeWidth={isModern ? 1.7 : 2} />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {isModern ? "Complete o essencial" : "Seu perfil pode melhorar"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {isModern
                        ? [
                            !checklist.foto && "Foto de capa",
                            !checklist.descricao && "Descrição curta",
                            !checklist.servicos && "Serviços com preço",
                          ]
                            .filter(Boolean)
                            .join(" · ") || "Tudo certo por aqui."
                        : `Vale a pena: ${[
                            !checklist.foto && "colocar uma foto de capa",
                            !checklist.descricao && "contar o estilo da sua barbearia",
                            !checklist.servicos && "cadastrar serviços e preços",
                          ]
                            .filter(Boolean)
                            .join(" · ")}`}
                    </p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSaveDados} className="space-y-6">
                {/* Seção Básico */}
                <div
                  className={
                    isModern
                      ? "space-y-4 border border-border rounded-lg p-4 bg-card"
                      : "space-y-4 border border-border/30 rounded-lg p-4 bg-secondary/20"
                  }
                >
                  <h3 className="text-xs font-semibold text-primary uppercase tracking-wider">Básico</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-foreground/90 text-sm font-medium flex items-center gap-1.5">
                        <Store className="w-4 h-4 text-primary" strokeWidth={isModern ? 1.7 : 2} />
                        <span>
                          {isModern ? "Nome" : "Nome da barbearia"}
                          {!isModern && <span className="text-primary ml-1">• Aparece em buscas</span>}
                        </span>
                      </Label>
                      {isModern && (
                        <p className="text-[11px] text-muted-foreground -mt-1">Aparece nas buscas</p>
                      )}
                      <Input
                        value={nomeBarbearia}
                        onChange={(e) => setNomeBarbearia(e.target.value)}
                        placeholder={isModern ? "Nome da barbearia" : "Ex: Barbearia Premium"}
                        className="bg-secondary border-border rounded-lg h-10 transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-foreground/90 text-sm font-medium flex items-center gap-1.5">
                        <Phone className="w-4 h-4 text-primary" /> 
                        <span>
                          Telefone
                          {!isModern && <span className="text-primary ml-1">• Contato rápido</span>}
                        </span>
                      </Label>
                      {isModern && (
                        <p className="text-[11px] text-muted-foreground -mt-1">Contato rápido (WhatsApp)</p>
                      )}
                      <Input
                        type="tel"
                        inputMode="numeric"
                        autoComplete="tel"
                        maxLength={16}
                        value={formatBrazilPhoneBr(telefone)}
                        onChange={(e) => setTelefone(sanitizeBrazilPhoneDigits(e.target.value))}
                        placeholder="(11) 99999-9999"
                        className="bg-secondary border-border rounded-lg h-10 transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30"
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label className="text-foreground/90 text-sm font-medium flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-primary" />
                        <span>Descrição</span>
                      </Label>
                      {!isModern && (
                        <p className="text-[11px] text-primary font-medium -mt-1">Perfis completos recebem mais agendamentos</p>
                      )}
                      <Textarea
                        ref={sobreTextareaRef}
                        value={sobre}
                        onChange={(e) => setSobre(e.target.value)}
                        placeholder={
                          isModern
                            ? "Descreva sua barbearia em poucas palavras."
                            : "Conte seu estilo, especialidades e o que faz sua barbearia diferente..."
                        }
                        maxLength={isModern ? 200 : undefined}
                        className="bg-secondary border-border rounded-lg min-h-[100px] resize-none transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30"
                      />
                      {isModern ? (
                        <div className="flex justify-end">
                          <span className="text-[11px] tabular-nums text-muted-foreground">{sobre.length}/200</span>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          Quanto mais específico, mais o cliente se identifica e agenda.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Seção Localização */}
                <div
                  className={
                    isModern
                      ? "space-y-4 border border-border rounded-lg p-4 bg-card"
                      : "space-y-4 border border-border/30 rounded-lg p-4 bg-secondary/20"
                  }
                >
                  <h3 className="text-xs font-semibold text-primary uppercase tracking-wider">Localização</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-foreground/90 text-sm font-medium">Cidade</Label>
                      <Input
                        value={cidade}
                        onChange={(e) => setCidade(e.target.value)}
                        placeholder="Sua cidade"
                        className="bg-secondary border-border rounded-lg h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-foreground/90 text-sm font-medium">Estado</Label>
                      <select
                        value={estado || "SP"}
                        onChange={(e) => setEstado(e.target.value)}
                        className="w-full rounded-lg bg-secondary border border-border px-3 py-2 text-sm text-foreground h-10 appearance-none cursor-pointer bg-[length:1rem_1rem] bg-[right_0.5rem_center] bg-no-repeat"
                        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")" }}
                      >
                        {ESTADOS.map((uf) => (
                          <option key={uf} value={uf}>{uf}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label className="text-foreground/90 text-sm font-medium flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-primary" /> 
                        <span>
                          Endereço completo
                          {!isModern && <span className="text-primary ml-1">• Aparece no mapa</span>}
                        </span>
                      </Label>
                      {isModern && (
                        <p className="text-[11px] text-muted-foreground -mt-1">Usado no mapa do perfil</p>
                      )}
                      <Input
                        value={endereco}
                        onChange={(e) => setEndereco(e.target.value)}
                        placeholder="Rua, número, bairro"
                        className="bg-secondary border-border rounded-lg h-10"
                      />
                    </div>
                  </div>
                </div>

                {/* Seção Operação */}
                <div
                  className={
                    isModern
                      ? "space-y-4 border border-border rounded-lg p-4 bg-card"
                      : "space-y-4 border border-border/30 rounded-lg p-4 bg-secondary/20"
                  }
                >
                  <h3 className="text-xs font-semibold text-primary uppercase tracking-wider">Operação</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-foreground/90 text-sm font-medium flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-primary" /> Desde
                      </Label>
                      <Input
                        type="date"
                        value={desde}
                        onChange={(e) => setDesde(e.target.value)}
                        className="bg-secondary border-border rounded-lg h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-foreground/90 text-sm font-medium flex items-center gap-1.5">
                        <User className="w-4 h-4 text-primary" /> Nome do barbeiro
                      </Label>
                      <Input
                        value={barberName}
                        onChange={(e) => setBarberName(e.target.value)}
                        placeholder="Seu nome"
                        className="bg-secondary border-border rounded-lg h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-foreground/90 text-sm font-medium">Preço médio</Label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {["R$ 30–50", "R$ 50–80", "R$ 80+"].map((faixa) => (
                          <motion.button
                            key={faixa}
                            type="button"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setPrecoMedio(faixa)}
                            className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                              precoMedio === faixa
                                ? "bg-primary/15 border-primary/50 text-primary"
                                : "bg-secondary border-border text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            {faixa}
                          </motion.button>
                        ))}
                      </div>
                      <Input
                        value={precoMedio}
                        onChange={(e) => setPrecoMedio(e.target.value)}
                        placeholder="Ex: R$ 50 - R$ 80"
                        className="bg-secondary border-border rounded-lg h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-foreground/90 text-sm font-medium flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-primary" strokeWidth={isModern ? 1.7 : 2} /> Tempo médio (min)
                      </Label>
                      {tempoMedioFromServices != null && (
                        <p
                          className={`text-xs flex items-center gap-1.5 mb-1 ${
                            isModern ? "text-primary/80" : "text-muted-foreground"
                          }`}
                        >
                          <Lightbulb
                            className={`w-3.5 h-3.5 shrink-0 ${isModern ? "text-primary" : "text-amber-500"}`}
                            strokeWidth={isModern ? 1.7 : 2}
                          />
                          Baseado nos serviços: {tempoMedioFromServices} min
                        </p>
                      )}
                      <Input
                        type="number"
                        min={10}
                        max={240}
                        value={tempoMedioMinutos}
                        onChange={(e) => setTempoMedioMinutos(Number(e.target.value))}
                        className="bg-secondary border-border rounded-lg h-10"
                      />
                    </div>
                  </div>
                </div>

                {/* Seção Diferenciais */}
                <div
                  className={
                    isModern
                      ? "space-y-4 border border-border rounded-lg p-4 bg-card"
                      : "space-y-4 border border-border/30 rounded-lg p-4 bg-secondary/20"
                  }
                >
                  <h3 className="text-xs font-semibold text-primary uppercase tracking-wider">
                    {isModern ? "Recursos disponíveis" : "O que seu cliente encontra no seu espaço"}
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-foreground/90 text-sm font-medium mb-3 block">
                        {isModern ? "Comodidades do espaço" : "Comodidades"}
                      </Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {[
                          { key: "wifi", label: "Wi-Fi", icon: Wifi },
                          { key: "estacionamento", label: "Estacionamento", icon: Car },
                          { key: "arCondicionado", label: "Ar-condicionado", icon: Snowflake },
                          { key: "cafe", label: "Café", icon: Coffee },
                          { key: "tv", label: "TV", icon: Tv },
                        ].map((item) => {
                          const Icon = item.icon;
                          const active = comodidades[item.key as keyof typeof comodidades];
                          return (
                            <motion.button
                              key={item.key}
                              type="button"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() =>
                                setComodidades((prev) => ({
                                  ...prev,
                                  [item.key]: !prev[item.key as keyof typeof prev],
                                }))
                              }
                              className={`h-11 rounded-lg border text-xs sm:text-sm px-3 flex items-center gap-2 transition-all duration-150 ${
                                active
                                  ? isModern
                                    ? "bg-primary/12 border-primary text-primary"
                                    : "bg-primary/15 border-primary/50 text-primary shadow-lg shadow-primary/20 ring-1 ring-primary/30"
                                  : "bg-secondary border-border text-muted-foreground hover:text-foreground hover:border-primary/30"
                              }`}
                            >
                              <Icon className="w-4 h-4 shrink-0" />
                              <span className="hidden sm:inline">{item.label}</span>
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <Label className="text-foreground/90 text-sm font-medium mb-3 block">
                        {isModern ? "Formas de pagamento" : "Formas de pagamento (cliente confia)"}
                      </Label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {[
                          { key: "pix", label: "Pix", icon: Zap },
                          { key: "debito", label: "Débito", icon: CreditCard },
                          { key: "credito", label: "Crédito", icon: CreditCard },
                          { key: "dinheiro", label: "Dinheiro", icon: Banknote },
                        ].map((item) => {
                          const Icon = item.icon;
                          const active = pagamentos[item.key as keyof typeof pagamentos];
                          return (
                            <motion.button
                              key={item.key}
                              type="button"
                              aria-pressed={active}
                              whileHover={{ scale: isModern ? 1.01 : 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() =>
                                setPagamentos((prev) => ({
                                  ...prev,
                                  [item.key]: !prev[item.key as keyof typeof prev],
                                }))
                              }
                              className={`h-11 rounded-lg border text-xs sm:text-sm px-3 flex items-center gap-2 transition-all duration-150 ${
                                active
                                  ? isModern
                                    ? "bg-primary/12 border-primary text-primary ring-1 ring-primary/25"
                                    : "bg-primary/15 border-primary/50 text-primary shadow-lg shadow-primary/20 ring-1 ring-primary/30"
                                  : "bg-secondary border-border text-muted-foreground hover:text-foreground hover:border-primary/30"
                              }`}
                            >
                              <Icon className="w-4 h-4 shrink-0" />
                              <span className="sm:inline">{item.label}</span>
                            </motion.button>
                          );
                        })}
                      </div>
                      {(pagamentos.debito || pagamentos.credito) && (
                        <div className="space-y-2 pt-3 mt-3 border-t border-border/30">
                          <Label className="text-foreground/80 text-xs font-medium">Bandeiras aceitas</Label>
                          <div className="flex flex-wrap gap-2">
                            {[
                              { key: "visa", label: "Visa" },
                              { key: "mastercard", label: "Mastercard" },
                              { key: "elo", label: "Elo" },
                              { key: "amex", label: "Amex" },
                            ].map((card) => {
                              const active = bandeiras[card.key as keyof typeof bandeiras];
                              return (
                                <motion.button
                                  key={card.key}
                                  type="button"
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() =>
                                    setBandeiras((prev) => ({
                                      ...prev,
                                      [card.key]: !prev[card.key as keyof typeof prev],
                                    }))
                                  }
                                  className={`px-3 py-1.5 rounded-full border text-xs transition-all duration-150 ${
                                    active
                                      ? isModern
                                        ? "bg-primary/12 border-primary text-primary"
                                        : "bg-primary/10 border-primary/50 text-primary shadow-md shadow-primary/20"
                                      : "bg-secondary border-border text-muted-foreground hover:border-primary/30"
                                  }`}
                                >
                                  {card.label}
                                </motion.button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Mapa e CTA */}
                <div className="sm:col-span-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 min-h-12 rounded-md border-border px-6 text-base font-medium"
                    onClick={openAddressInMap}
                  >
                    <ExternalLink className="w-5 h-5 mr-2 text-primary shrink-0" />
                    Visualizar endereço no mapa
                  </Button>
                </div>
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="inline-flex shrink-0 min-w-min max-w-full"
                  >
                    <Button
                      type="submit"
                      disabled={saveDadosLoading}
                      className={`rounded-md shrink-0 min-w-min h-12 min-h-12 px-7 sm:px-8 text-base font-semibold transition-all ${
                        saveDadosSuccess
                          ? "bg-emerald-600/90 text-emerald-50 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20"
                          : "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground hover:shadow-xl hover:shadow-primary/30 shadow-lg shadow-primary/20"
                      }`}
                    >
                      {saveDadosLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin shrink-0" />
                          Atualizando perfil...
                        </>
                      ) : saveDadosSuccess ? (
                        <>
                          <Check className="w-5 h-5 mr-2 shrink-0" />
                          Perfil melhorado
                        </>
                      ) : (
                        <>
                          <Save className="w-5 h-5 mr-2 shrink-0" />
                          Salvar e melhorar perfil
                        </>
                      )}
                    </Button>
                  </motion.div>
                  {saveDadosSuccess && (
                    <motion.span
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-sm text-emerald-500 font-medium flex items-center gap-1"
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Seu novo perfil é uma máquina de conversão!
                    </motion.span>
                  )}
                </div>
              </form>

              {/* Adicionar barbeiro — escala */}
              <div className="mt-8 pt-6 border-t border-border/60">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-primary" />
                  Equipe
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Quando sua barbearia crescer, você poderá adicionar mais barbeiros e ver a agenda de cada um.
                </p>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => toast({ title: "Em breve", description: "Adicionar barbeiro estará disponível em breve." })}
                  className="inline-flex items-center gap-2 rounded-lg border border-dashed border-primary/50 bg-primary/5 px-4 py-2.5 text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar barbeiro
                </motion.button>
              </div>
            </motion.div>
          )}

          {abaAtiva === "redes" && (
            <motion.div
              key="redes"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: isModern ? 0.12 : 0.2 }}
              className={
                isModern
                  ? "rounded-xl border border-border bg-card p-5 sm:p-6 shadow-none"
                  : "bg-card border border-border/50 rounded-2xl p-6 shadow-lg"
              }
            >
              <div className={`pb-4 mb-5 ${isModern ? "border-b border-border" : "border-b border-border/60"}`}>
                <h2
                  className={
                    isModern
                      ? "text-lg font-semibold text-foreground tracking-tight flex items-center gap-2"
                      : "text-xl font-display font-bold text-foreground flex items-center gap-2"
                  }
                >
                  <MessageCircle className={isModern ? "w-5 h-5 text-primary shrink-0" : "w-6 h-6 text-primary shrink-0"} strokeWidth={isModern ? 1.7 : 2} />
                  {isModern ? "Canais de contato" : "Central de contato"}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {isModern
                    ? "Conecte seus canais para receber mais clientes."
                    : "Como os clientes entram em contato com você. Redes conectadas geram mais confiança e agendamentos."}
                </p>
                {!isModern && (
                  <p className="text-xs text-primary font-medium mt-2 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Perfis com redes conectadas recebem +40% mais agendamentos
                  </p>
                )}
              </div>

              <p className="text-xs text-muted-foreground flex items-start gap-1.5 mb-4">
                <Lightbulb className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${isModern ? "text-primary" : "text-amber-500"}`} strokeWidth={isModern ? 1.7 : 2} />
                {isModern
                  ? "Use o mesmo @ em todas as redes para ser encontrado com facilidade."
                  : "Dica: Use o mesmo nome em todas as redes para ser encontrado mais fácil (ex: @minhabarbearia)."}
              </p>

              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Coluna esquerda: conexões */}
                <div className="lg:col-span-3 space-y-4">
                  <form onSubmit={handleSaveRedes} className="space-y-4">
                    {/* WhatsApp — destaque */}
                    <motion.div
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={isModern ? { duration: 0.12 } : undefined}
                      whileHover={isModern ? undefined : { y: -2, scale: 1.005 }}
                      className={
                        isModern
                          ? `rounded-md border p-4 transition-colors duration-150 bg-card ${
                              whatsapp.trim() && whatsappNumber.length >= 10
                                ? "border-emerald-500/35"
                                : "border-border"
                            }`
                          : `rounded-xl border-2 p-4 transition-colors ${
                              whatsapp.trim() ? "border-emerald-500/40 bg-emerald-500/5" : "border-amber-500/30 bg-amber-500/5"
                            }`
                      }
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="flex items-center gap-2 font-semibold text-foreground">
                          <MessageCircle className="w-5 h-5 text-emerald-500" />
                          WhatsApp (principal)
                        </span>
                        <span
                          className={`text-xs font-medium flex items-center gap-1 ${
                            whatsapp.trim() && whatsappNumber.length >= 10
                              ? "text-emerald-500"
                              : isModern
                                ? "text-blue-900 dark:text-blue-400"
                                : "text-amber-500"
                          }`}
                        >
                          {whatsapp.trim() && whatsappNumber.length >= 10 ? (
                            <><Check className="w-3.5 h-3.5" /> Conectado</>
                          ) : whatsapp.trim() ? (
                            <><AlertCircle className="w-3.5 h-3.5" strokeWidth={isModern ? 1.7 : 2} /> Incompleto</>
                          ) : (
                            <><AlertCircle className="w-3.5 h-3.5" strokeWidth={isModern ? 1.7 : 2} /> Não configurado</>
                          )}
                        </span>
                      </div>
                      <Input
                        value={whatsapp}
                        onChange={(e) => setWhatsapp(maskWhatsapp(e.target.value))}
                        placeholder="(00) 00000-0000"
                        className={`bg-background border-border h-11 text-base transition-shadow duration-150 focus-visible:ring-2 focus-visible:ring-primary/25 ${
                          isModern ? "rounded-md" : "rounded-lg"
                        }`}
                      />
                      <motion.button
                        type="button"
                        whileHover={isModern ? undefined : { scale: 1.02 }}
                        whileTap={{ scale: isModern ? 0.99 : 0.98 }}
                        onClick={openWhatsAppTest}
                        className={`mt-3 w-full min-h-12 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-base flex items-center justify-center gap-2 shadow-none transition-colors ${
                          isModern ? "rounded-md duration-150" : "rounded-md"
                        }`}
                      >
                        <MessageCircle className="w-5 h-5 shrink-0" />
                        Testar WhatsApp
                      </motion.button>
                    </motion.div>

                    {/* Instagram */}
                    <motion.div
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: isModern ? 0.02 : 0.05, duration: isModern ? 0.12 : undefined }}
                      whileHover={isModern ? undefined : { y: -2, scale: 1.005 }}
                      className={
                        isModern
                          ? `rounded-md border p-4 transition-colors duration-150 bg-card ${
                              instagram.trim() ? "border-pink-500/30" : "border-border"
                            }`
                          : `rounded-xl border-2 p-4 transition-colors ${
                              instagram.trim() ? "border-pink-500/30 bg-pink-500/5" : "border-border/60 bg-secondary/30"
                            }`
                      }
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="flex items-center gap-2 font-semibold text-foreground">
                          <IconInstagram className="w-5 h-5 text-pink-500" />
                          Instagram
                        </span>
                        <span className={`text-xs font-medium flex items-center gap-1 ${
                          instagram.trim() ? "text-emerald-500" : "text-muted-foreground"
                        }`}>
                          {instagram.trim() ? <><Check className="w-3.5 h-3.5" /> Conectado</> : <>Não configurado</>}
                        </span>
                      </div>
                      <Input
                        value={instagram}
                        onChange={(e) => setInstagram(maskHandle(e.target.value))}
                        placeholder="@suabarbearia"
                        className="bg-background border-border rounded-lg h-10"
                      />
                      <div className="flex gap-2 mt-2">
                        <Button type="button" variant="outline" size="sm" onClick={openInstagram}>
                          <ExternalLink className="w-3.5 h-3.5 mr-1" /> Abrir Instagram
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => copyToClipboard(instagram ? `https://instagram.com/${instagram.replace(/^@/, "")}` : "", "Instagram")}>
                          <Copy className="w-3.5 h-3.5 mr-1" /> Copiar link
                        </Button>
                      </div>
                    </motion.div>

                    {/* TikTok */}
                    <motion.div
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                      whileHover={{ y: -2, scale: 1.005 }}
                      className={`rounded-xl border-2 p-4 transition-colors ${
                        tiktok.trim() ? "border-foreground/40 bg-secondary/50" : "border-border/60 bg-secondary/30"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="flex items-center gap-2 font-semibold text-foreground">
                          <IconTikTok className="w-5 h-5" />
                          TikTok
                        </span>
                        <span className={`text-xs font-medium flex items-center gap-1 ${
                          tiktok.trim() ? "text-emerald-500" : "text-muted-foreground"
                        }`}>
                          {tiktok.trim() ? <><Check className="w-3.5 h-3.5" /> Conectado</> : <>Não configurado</>}
                        </span>
                      </div>
                      <Input
                        value={tiktok}
                        onChange={(e) => setTiktok(maskHandle(e.target.value))}
                        placeholder="@suabarbearia"
                        className={`bg-background border-border h-10 transition-shadow duration-150 focus-visible:ring-2 focus-visible:ring-primary/25 ${
                          isModern ? "rounded-md" : "rounded-lg"
                        }`}
                      />
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={openTiktok}
                          className={isModern ? "rounded-md shadow-none border-border transition-colors duration-150" : ""}
                        >
                          <ExternalLink className="w-3.5 h-3.5 mr-1" /> Abrir TikTok
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(tiktok ? `https://tiktok.com/@${tiktok.replace(/^@/, "")}` : "", "TikTok")}
                          className={isModern ? "rounded-md shadow-none border-border transition-colors duration-150" : ""}
                        >
                          <Copy className="w-3.5 h-3.5 mr-1" /> Copiar link
                        </Button>
                      </div>
                    </motion.div>

                    {/* Facebook */}
                    <motion.div
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: isModern ? 0.06 : 0.15, duration: isModern ? 0.12 : undefined }}
                      whileHover={isModern ? undefined : { y: -2, scale: 1.005 }}
                      className={
                        isModern
                          ? `rounded-md border p-4 transition-colors duration-150 bg-card ${
                              facebook.trim() ? "border-blue-500/30" : "border-border"
                            }`
                          : `rounded-xl border-2 p-4 transition-colors ${
                              facebook.trim() ? "border-blue-500/30 bg-blue-500/5" : "border-border/60 bg-secondary/30"
                            }`
                      }
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="flex items-center gap-2 font-semibold text-foreground">
                          <IconFacebook className="w-5 h-5 text-blue-500" />
                          Facebook
                        </span>
                        <span className={`text-xs font-medium flex items-center gap-1 ${
                          facebook.trim() ? "text-emerald-500" : "text-muted-foreground"
                        }`}>
                          {facebook.trim() ? <><Check className="w-3.5 h-3.5" /> Conectado</> : <>Não configurado</>}
                        </span>
                      </div>
                      <Input
                        value={facebook}
                        onChange={(e) => setFacebook(maskFacebook(e.target.value))}
                        placeholder="facebook.com/suabarbearia"
                        className={`bg-background border-border h-10 transition-shadow duration-150 focus-visible:ring-2 focus-visible:ring-primary/25 ${
                          isModern ? "rounded-md" : "rounded-lg"
                        }`}
                      />
                      {facebook.trim() && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className={`mt-2 ${isModern ? "rounded-md shadow-none border-border transition-colors duration-150" : ""}`}
                          onClick={() => window.open(facebook.trim().startsWith("http") ? facebook.trim() : `https://${facebook.trim()}`, "_blank")}
                        >
                          <ExternalLink className="w-3.5 h-3.5 mr-1" /> Abrir link
                        </Button>
                      )}
                    </motion.div>

                    <div className="flex flex-wrap items-center gap-3 pt-2">
                      {isModern ? (
                        <Button
                          type="submit"
                          className="h-12 min-h-12 rounded-md px-6 sm:px-8 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto shadow-none transition-colors duration-150 active:scale-[0.99]"
                        >
                          {saveRedesSuccess ? (
                            <>
                              <Check className="w-5 h-5 mr-2 shrink-0" /> Redes atualizadas
                            </>
                          ) : (
                            <>
                              <Save className="w-5 h-5 mr-2 shrink-0" /> Salvar contatos
                            </>
                          )}
                        </Button>
                      ) : (
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="inline-flex max-w-full">
                          <Button
                            type="submit"
                            className={`h-12 min-h-12 rounded-md px-6 sm:px-8 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto ${saveRedesSuccess ? "animate-pulse" : ""}`}
                          >
                            {saveRedesSuccess ? (
                              <>
                                <Check className="w-5 h-5 mr-2 shrink-0" /> Redes atualizadas
                              </>
                            ) : (
                              <>
                                <Save className="w-5 h-5 mr-2 shrink-0" /> Salvar contatos
                              </>
                            )}
                          </Button>
                        </motion.div>
                      )}
                      {saveRedesSuccess && (
                        <span className="text-sm text-emerald-500">Alterações salvas com sucesso.</span>
                      )}
                    </div>
                  </form>
                </div>

                {/* Coluna direita: preview como cliente vê */}
                <div className="lg:col-span-2">
                  <motion.div
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: isModern ? 0.08 : 0.2, duration: isModern ? 0.12 : undefined }}
                    className={
                      isModern
                        ? "rounded-xl border border-border bg-background p-4 sticky top-4 shadow-none"
                        : "rounded-2xl border border-border/60 bg-muted/20 p-4 sticky top-4"
                    }
                  >
                    <div className={isModern ? "flex items-center justify-between gap-2 pb-2 mb-3 border-b border-border" : ""}>
                      <h3
                        className={
                          isModern
                            ? "text-sm font-semibold text-foreground flex items-center gap-2"
                            : "text-sm font-semibold text-foreground flex items-center gap-2 mb-3"
                        }
                      >
                        <Eye className="w-4 h-4 text-primary shrink-0" />
                        {isModern ? "Prévia no perfil" : "Como os clientes veem"}
                      </h3>
                      {isModern && (
                        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground shrink-0">
                          Ao vivo
                        </span>
                      )}
                    </div>
                    {!isModern && (
                      <p className="text-xs text-muted-foreground mb-4">
                        Botões que aparecem na sua página para o cliente entrar em contato.
                      </p>
                    )}
                    {isModern && (
                      <p className="text-[11px] text-muted-foreground mb-3">É assim que o botão de contato aparece para o cliente.</p>
                    )}
                    <div className="space-y-2">
                      <div
                        className={
                          isModern
                            ? "rounded-md border border-border bg-card p-3"
                            : "rounded-lg border border-border/60 bg-card p-3"
                        }
                      >
                        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground mb-2">
                          {isModern ? "Ação principal" : "Falar com barbeiro"}
                        </p>
                        {whatsappLink ? (
                          <a
                            href={whatsappLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`inline-flex items-center gap-2 bg-emerald-600 text-white px-3 py-2 text-sm font-medium hover:bg-emerald-700 transition-colors shadow-none ${
                              isModern ? "rounded-md duration-150" : "rounded-lg"
                            }`}
                          >
                            <MessageCircle className="w-4 h-4" strokeWidth={isModern ? 1.7 : 2} />
                            {isModern ? "Falar com barbeiro" : "WhatsApp"}
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground">Configure o número ao lado</span>
                        )}
                      </div>
                      <div
                        className={
                          isModern
                            ? "rounded-md border border-border bg-card p-3"
                            : "rounded-lg border border-border/60 bg-card p-3"
                        }
                      >
                        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground mb-2">
                          {isModern ? "Links" : "Redes sociais"}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {instagram.trim() && (
                            <span className="inline-flex items-center gap-1.5 rounded-lg bg-pink-500/15 text-pink-600 dark:text-pink-400 px-2.5 py-1.5 text-xs font-medium">
                              <IconInstagram className="w-4 h-4" /> Instagram
                            </span>
                          )}
                          {tiktok.trim() && (
                            <span className="inline-flex items-center gap-1.5 rounded-lg bg-foreground/10 px-2.5 py-1.5 text-xs font-medium">
                              <IconTikTok className="w-4 h-4" /> TikTok
                            </span>
                          )}
                          {facebook.trim() && (
                            <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400 px-2.5 py-1.5 text-xs font-medium">
                              <IconFacebook className="w-4 h-4" /> Facebook
                            </span>
                          )}
                          {!instagram.trim() && !tiktok.trim() && !facebook.trim() && (
                            <span className="text-xs text-muted-foreground">Nenhuma rede configurada</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}

          {abaAtiva === "horarios" && schedule && (() => {
            const daysOpenCount = DAY_NAMES.filter(({ value: d }) => schedule[d]).length;
            const totalMinutesWeek = DAY_NAMES.reduce((sum, { value: d }) => {
              const s = schedule[d];
              return sum + (s ? slotMinutes(s) : 0);
            }, 0);
            const totalHoursWeek = (totalMinutesWeek / 60).toFixed(1);
            const tempoMedio = tempoMedioMinutos || 45;
            const avgMinutesPerDay = daysOpenCount ? totalMinutesWeek / daysOpenCount : 0;
            const clientesPorDia = Math.floor(avgMinutesPerDay / tempoMedio);
            const sabadoFechado = !schedule[6];
            const formatSlot = (s: DaySchedule) => {
              if (s.open2 && s.close2) return `${s.open.slice(0, 5)}–${s.close.slice(0, 5)} e ${s.open2.slice(0, 5)}–${s.close2.slice(0, 5)}`;
              return `${s.open.slice(0, 5)} às ${s.close.slice(0, 5)}`;
            };
            const previewParts: string[] = [];
            let i = 0;
            while (i < 7) {
              const s = schedule[i as DayOfWeek];
              if (!s) {
                previewParts.push(`${DAY_LABELS_SHORT[i].slice(0, 3)}: fechado`);
                i++;
                continue;
              }
              const label = DAY_LABELS_SHORT[i].slice(0, 3);
              let j = i;
              while (j + 1 < 7 && schedule[(j + 1) as DayOfWeek] && formatSlot(schedule[(j + 1) as DayOfWeek]!) === formatSlot(s)) j++;
              if (j > i) {
                previewParts.push(`${label}–${DAY_LABELS_SHORT[j].slice(0, 3)}: ${formatSlot(s)}`);
                i = j + 1;
              } else {
                previewParts.push(`${label}: ${formatSlot(s)}`);
                i++;
              }
            }
            const previewText = previewParts.join(" · ");
            return (
              <motion.div
                key="horarios"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: isModern ? 0.12 : 0.2 }}
                className={
                  isModern
                    ? "bg-card border border-border rounded-lg p-4 sm:p-5 shadow-none space-y-4"
                    : "bg-card border border-border/50 rounded-2xl p-6 shadow-lg space-y-5"
                }
              >
                <div className={isModern ? "pb-4 border-b border-border" : "pb-4 border-b border-border/60"}>
                  <h2
                    className={
                      isModern
                        ? "text-lg font-semibold text-foreground tracking-tight flex items-center gap-2"
                        : "text-xl font-display font-bold text-foreground flex items-center gap-2"
                    }
                  >
                    <Clock className={isModern ? "w-5 h-5 text-primary shrink-0" : "w-6 h-6 text-primary shrink-0"} strokeWidth={isModern ? 1.7 : 2} />
                    Horários de atendimento
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {isModern
                      ? "O que o cliente vê no perfil. Edite por dia ou use um modelo rápido."
                      : "Defina quando você atende. Clientes verão essas informações na sua página."}
                  </p>
                </div>

                {/* Resumo semanal */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: isModern ? 0.12 : undefined }}
                  className="grid grid-cols-2 sm:grid-cols-4 gap-3"
                >
                  <motion.div
                    whileHover={isModern ? { y: -1 } : { y: -2, scale: 1.01 }}
                    className={
                      isModern
                        ? "rounded-lg border border-border bg-card p-3 transition-colors duration-150"
                        : "glass-card rounded-xl p-3"
                    }
                  >
                    <p className="text-xs text-muted-foreground">Dias por semana</p>
                    <p className={isModern ? "text-lg font-bold text-foreground tabular-nums" : "text-lg font-display font-bold text-foreground"}>
                      {daysOpenCount}
                    </p>
                  </motion.div>
                  <motion.div
                    whileHover={isModern ? { y: -1 } : { y: -2, scale: 1.01 }}
                    className={
                      isModern
                        ? "rounded-lg border border-border bg-card p-3 transition-colors duration-150"
                        : "glass-card rounded-xl p-3"
                    }
                  >
                    <p className="text-xs text-muted-foreground">Total semanal</p>
                    <p className={isModern ? "text-lg font-bold text-foreground tabular-nums" : "text-lg font-display font-bold text-foreground"}>
                      {totalHoursWeek}h
                    </p>
                  </motion.div>
                  <motion.div
                    whileHover={isModern ? { y: -1 } : { y: -2, scale: 1.01 }}
                    className={
                      isModern
                        ? "rounded-lg border border-border bg-card p-3 transition-colors duration-150"
                        : "glass-card rounded-xl p-3"
                    }
                  >
                    <p className="text-xs text-muted-foreground">Tempo médio/atendimento</p>
                    <p className={isModern ? "text-lg font-bold text-foreground tabular-nums" : "text-lg font-display font-bold text-foreground"}>
                      {tempoMedio} min
                    </p>
                  </motion.div>
                  <motion.div
                    whileHover={isModern ? { y: -1 } : { y: -2, scale: 1.01 }}
                    className={
                      isModern
                        ? "rounded-lg border border-border bg-card p-3 transition-colors duration-150"
                        : "glass-card rounded-xl p-3"
                    }
                  >
                    <p className="text-xs text-muted-foreground">Capacidade/dia*</p>
                    <p className={isModern ? "text-lg font-bold text-primary tabular-nums" : "text-lg font-display font-bold text-primary"}>
                      ~{clientesPorDia} clientes
                    </p>
                  </motion.div>
                </motion.div>
                <p className="text-xs text-muted-foreground -mt-2">* Baseado no seu tempo médio e horário configurado.</p>

                {/* Templates + Aplicar para todos */}
                <div className="space-y-3">
                  <p className="text-sm font-medium text-foreground">Horários rápidos</p>
                  <div className="flex flex-wrap gap-2">
                    <motion.button
                      type="button"
                      whileHover={isModern ? { scale: 1.01 } : { scale: 1.02 }}
                      whileTap={{ scale: isModern ? 0.99 : 0.98 }}
                      transition={{ duration: isModern ? 0.12 : undefined }}
                      onClick={() => applyTemplate("comercial")}
                      className={chipHorarioRapidoClass("comercial")}
                    >
                      Comercial 09h–18h
                    </motion.button>
                    <motion.button
                      type="button"
                      whileHover={isModern ? { scale: 1.01 } : { scale: 1.02 }}
                      whileTap={{ scale: isModern ? 0.99 : 0.98 }}
                      transition={{ duration: isModern ? 0.12 : undefined }}
                      onClick={() => applyTemplate("meio")}
                      className={chipHorarioRapidoClass("meio")}
                    >
                      Meio período 09h–13h
                    </motion.button>
                    <motion.button
                      type="button"
                      whileHover={isModern ? { scale: 1.01 } : { scale: 1.02 }}
                      whileTap={{ scale: isModern ? 0.99 : 0.98 }}
                      transition={{ duration: isModern ? 0.12 : undefined }}
                      onClick={() => applyTemplate("almoco")}
                      className={chipHorarioRapidoClass("almoco")}
                    >
                      Com intervalo 12h–13h
                    </motion.button>
                  </div>
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-sm text-muted-foreground">Ou:</span>
                    <motion.button
                      type="button"
                      whileHover={isModern ? { scale: 1.01 } : { scale: 1.02 }}
                      whileTap={{ scale: isModern ? 0.99 : 0.98 }}
                      transition={{ duration: isModern ? 0.12 : undefined }}
                      onClick={() => applyToAllDays(schedule[1] ?? { open: "09:00", close: "18:00" })}
                      className={
                        isModern
                          ? "rounded-md border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors duration-150"
                          : "rounded-lg border border-border bg-secondary/30 px-3 py-2 text-sm font-medium text-foreground hover:bg-primary/10 hover:border-primary/40 hover:text-primary"
                      }
                    >
                      Aplicar horário de Segunda para todos os dias
                    </motion.button>
                  </div>
                </div>

                {sabadoFechado && (
                  <p
                    className={`text-xs flex items-center gap-1.5 ${
                      isModern ? "text-muted-foreground" : "text-amber-600 dark:text-amber-400"
                    }`}
                  >
                    <Lightbulb className={`w-3.5 h-3.5 shrink-0 ${isModern ? "text-primary" : ""}`} strokeWidth={isModern ? 1.7 : 2} />
                    Dica: Abrir aos sábados costuma aumentar agendamentos.
                  </p>
                )}

                {/* Preview cliente */}
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: isModern ? 0.12 : undefined }}
                  whileHover={isModern ? undefined : { scale: 1.005 }}
                  className={
                    isModern
                      ? "rounded-lg border border-border bg-card p-4 shadow-none"
                      : "rounded-xl border border-border/60 bg-muted/20 p-4"
                  }
                >
                  <p className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-2">
                    <Eye className="w-4 h-4 text-primary" />
                    {isModern ? "Resumo no perfil" : "Clientes verão"}
                  </p>
                  <p className="text-sm text-muted-foreground break-words">{previewText}</p>
                </motion.div>

                <form onSubmit={handleSaveHorarios} className="space-y-3">
                  {DAY_NAMES.map(({ value: day }) => {
                    const slot = schedule[day];
                    const isOpen = !!slot;
                    const hasLunch = !!(slot?.open2 && slot?.close2);
                    const validationError = slot ? validateSlot(slot) : null;
                    return (
                      <motion.div
                        key={day}
                        variants={itemVariants}
                        whileHover={isModern ? undefined : { y: -1 }}
                        className={`transition-colors duration-150 ${
                          isModern
                            ? `rounded-lg p-3 ${isOpen ? "border border-primary/25 bg-card" : "border border-border bg-muted/25"}`
                            : `rounded-xl p-4 ${isOpen ? "border-2 border-primary/30 bg-primary/5" : "border-2 border-border/60 bg-secondary/20"}`
                        }`}
                      >
                        <div className="flex flex-wrap items-center gap-3">
                          <Switch
                            checked={isOpen}
                            onCheckedChange={(checked) => toggleDay(day, checked)}
                            className="data-[state=checked]:bg-primary"
                          />
                          <span className="text-sm font-semibold text-foreground w-28">
                            {DAY_LABELS_SHORT[day]}
                          </span>
                          {!isOpen && (
                            <span className="text-sm text-muted-foreground font-medium">Dia fechado</span>
                          )}
                          {isOpen && (
                            <>
                              <div className="flex items-center gap-2 flex-wrap">
                                <Input
                                  type="time"
                                  value={slot!.open}
                                  onChange={(e) => updateDayTime(day, "open", e.target.value)}
                                  className={isModern ? "w-[6.75rem] bg-background border-border h-8 text-xs" : "w-28 bg-background border-border h-9 text-sm"}
                                />
                                <span className={`text-muted-foreground ${isModern ? "text-xs" : "text-sm"}`}>até</span>
                                {!hasLunch ? (
                                  <Input
                                    type="time"
                                    value={slot!.close}
                                    onChange={(e) => updateDayTime(day, "close", e.target.value)}
                                    className={isModern ? "w-[6.75rem] bg-background border-border h-8 text-xs" : "w-28 bg-background border-border h-9 text-sm"}
                                  />
                                ) : (
                                  <>
                                    <Input
                                      type="time"
                                      value={slot!.close}
                                      onChange={(e) => updateDayTime(day, "close", e.target.value)}
                                      className={isModern ? "w-20 bg-background border-border h-8 text-xs" : "w-24 bg-background border-border h-9 text-sm"}
                                      title="Fecha p/ almoço"
                                    />
                                    <span className="text-xs text-muted-foreground">almoço</span>
                                    <Input
                                      type="time"
                                      value={slot!.open2}
                                      onChange={(e) => updateDayTime(day, "open2", e.target.value)}
                                      className={isModern ? "w-20 bg-background border-border h-8 text-xs" : "w-24 bg-background border-border h-9 text-sm"}
                                    />
                                    <span className={`text-muted-foreground ${isModern ? "text-xs" : "text-sm"}`}>até</span>
                                    <Input
                                      type="time"
                                      value={slot!.close2}
                                      onChange={(e) => updateDayTime(day, "close2", e.target.value)}
                                      className={isModern ? "w-[6.75rem] bg-background border-border h-8 text-xs" : "w-28 bg-background border-border h-9 text-sm"}
                                    />
                                  </>
                                )}
                              </div>
                              {!hasLunch ? (
                                <motion.button type="button" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                  onClick={() => toggleLunch(day, true)}
                                  className="text-xs font-medium text-primary hover:underline"
                                >
                                  + Adicionar pausa
                                </motion.button>
                              ) : (
                                <motion.button type="button" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                  onClick={() => toggleLunch(day, false)}
                                  className="text-xs text-muted-foreground hover:text-foreground"
                                >
                                  Remover pausa
                                </motion.button>
                              )}
                              <div className="w-full flex flex-wrap gap-2 mt-1">
                                {(DAY_NAMES as { value: DayOfWeek }[]).filter(({ value: d }) => d !== day).map(({ value: toDay }) => (
                                  <motion.button
                                    key={toDay}
                                    type="button"
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => copyDayTo(day, toDay)}
                                    className="text-xs text-muted-foreground hover:text-primary"
                                  >
                                    Copiar → {DAY_LABELS_SHORT[toDay].slice(0, 3)}
                                  </motion.button>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                        {validationError && (
                          <p className="text-xs text-destructive mt-2 flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" strokeWidth={isModern ? 1.7 : 2} />
                            {validationError}
                          </p>
                        )}
                      </motion.div>
                    );
                  })}
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    {isModern ? (
                      <Button
                        type="submit"
                        className="h-12 min-h-12 rounded-md px-6 sm:px-8 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto shadow-none transition-colors duration-150 active:scale-[0.99]"
                      >
                        {saveHorariosSuccess ? (
                          <>
                            <Check className="w-5 h-5 mr-2 shrink-0" /> Horários atualizados
                          </>
                        ) : (
                          <>
                            <Save className="w-5 h-5 mr-2 shrink-0" /> Salvar horários
                          </>
                        )}
                      </Button>
                    ) : (
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="inline-flex max-w-full">
                        <Button
                          type="submit"
                          className="h-12 min-h-12 rounded-md px-6 sm:px-8 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto"
                        >
                          {saveHorariosSuccess ? (
                            <>
                              <Check className="w-5 h-5 mr-2 shrink-0" /> Horários atualizados
                            </>
                          ) : (
                            <>
                              <Save className="w-5 h-5 mr-2 shrink-0" /> Salvar horários
                            </>
                          )}
                        </Button>
                      </motion.div>
                    )}
                    {saveHorariosSuccess && <span className="text-sm text-emerald-500">Alterações salvas com sucesso.</span>}
                  </div>
                </form>

                {/* Sugestão modo automático (sábado) */}
                {sabadoFechado && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: isModern ? 0.12 : undefined }}
                    className={
                      isModern
                        ? "rounded-lg border border-border bg-muted/30 p-3"
                        : "rounded-xl border border-primary/30 bg-primary/10 p-3"
                    }
                  >
                    <p className="text-xs font-medium text-foreground flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-primary" />
                      Sugerido com base na demanda
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">Abrir sábado 09h–14h pode aumentar agendamentos. Use o template ou edite manualmente.</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => {
                        if (!schedule) return;
                        const next = { ...schedule };
                        next[6] = { open: "09:00", close: "14:00" };
                        setSchedule(next);
                        toast({ title: "Sábado configurado", description: "09h às 14h. Ajuste se quiser." });
                      }}
                    >
                      Aplicar 09h–14h no sábado
                    </Button>
                  </motion.div>
                )}
              </motion.div>
            );
          })()}

          {abaAtiva === "fotos" && (
            <motion.div
              key="fotos"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: isModern ? 0.15 : 0.2 }}
              className={
                isModern
                  ? "rounded-xl border border-white/[0.08] bg-[#111111] p-4 shadow-none space-y-3"
                  : "bg-card border border-border/50 rounded-2xl p-6 shadow-lg space-y-5"
              }
            >
              <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between ${isModern ? "gap-2" : "gap-3"}`}>
                <div className="flex items-center gap-2">
                  <ImagePlus className={`text-primary shrink-0 ${isModern ? "w-4 h-4" : "w-5 h-5"}`} />
                  <div>
                    <h2 className={`font-semibold text-foreground ${isModern ? "text-base font-sans tracking-tight" : "text-lg font-display"}`}>
                      {isModern ? "Galeria de fotos" : "Galeria — venda o corte antes do cliente sentar na cadeira"}
                    </h2>
                    <p className={`text-muted-foreground ${isModern ? "text-xs mt-0.5" : "text-sm"}`}>
                      {isModern
                        ? "Gerencie as fotos do seu perfil público."
                        : "Portfólio filtrável, destaques e métricas. Tudo aqui puxa conversão."}
                    </p>
                  </div>
                </div>
                <Link
                  to={`/cliente/barbearia/${barbershopId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-1.5 shrink-0 text-sm font-medium text-primary transition-colors duration-150 ${isModern ? "hover:text-primary/80" : "hover:underline"}`}
                >
                  <Eye className="w-4 h-4" />
                  Ver como cliente vê
                </Link>
              </div>

              {/* Filtro por categoria */}
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: isModern ? 0.12 : undefined }}
                className={isModern ? "flex flex-wrap gap-1 border-b border-white/[0.08]" : "flex flex-wrap gap-2"}
              >
                {(["todos", ...GALLERY_CATEGORIES.map((c) => c.value)] as const).map((cat) => (
                  <motion.button
                    key={cat}
                    type="button"
                    whileHover={isModern ? { opacity: 0.92 } : { y: -1, scale: 1.02 }}
                    whileTap={{ scale: isModern ? 0.98 : 0.98 }}
                    transition={{ duration: isModern ? 0.12 : undefined }}
                    onClick={() => setGalleryFilter(cat)}
                    className={
                      isModern
                        ? `pb-2 px-2.5 text-xs font-medium transition-colors duration-150 border-b-2 -mb-px rounded-none ${
                            galleryFilter === cat
                              ? "border-primary text-foreground"
                              : "border-transparent text-muted-foreground hover:text-foreground"
                          }`
                        : `rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                            galleryFilter === cat
                              ? "bg-primary text-primary-foreground"
                              : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                          }`
                    }
                  >
                    {cat === "todos" ? "Todos" : GALLERY_CATEGORIES.find((c) => c.value === cat)?.label ?? cat}
                  </motion.button>
                ))}
              </motion.div>

              {/* Upload: single ou antes/depois */}
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: isModern ? 0.12 : undefined }}
                whileHover={isModern ? undefined : { scale: 1.003 }}
                className={
                  isModern
                    ? "rounded-lg border border-white/[0.08] bg-[#0F0F0F] p-3 space-y-2 shadow-none"
                    : "rounded-xl border border-border bg-secondary/30 p-4 space-y-3"
                }
              >
                <div className={isModern ? "inline-flex rounded-md border border-white/[0.08] bg-black/50 p-0.5 gap-0" : "flex flex-wrap gap-2"}>
                  <button
                    type="button"
                    onClick={() => setNewPhotoKind("single")}
                    className={
                      isModern
                        ? `rounded-sm px-3 py-1.5 text-sm font-medium transition-colors duration-150 ${
                            newPhotoKind === "single"
                              ? "bg-primary text-primary-foreground"
                              : "text-muted-foreground hover:bg-white/[0.06] hover:text-foreground"
                          }`
                        : `rounded-lg px-3 py-2 text-sm font-medium ${newPhotoKind === "single" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`
                    }
                  >
                    Foto única
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewPhotoKind("antes-depois")}
                    className={
                      isModern
                        ? `rounded-sm px-3 py-1.5 text-sm font-medium transition-colors duration-150 ${
                            newPhotoKind === "antes-depois"
                              ? "bg-primary text-primary-foreground"
                              : "text-muted-foreground hover:bg-white/[0.06] hover:text-foreground"
                          }`
                        : `rounded-lg px-3 py-2 text-sm font-medium ${newPhotoKind === "antes-depois" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`
                    }
                  >
                    Antes / Depois
                  </button>
                </div>
                {newPhotoKind === "single" ? (
                  <div className={`flex flex-col sm:flex-row flex-wrap ${isModern ? "gap-1.5" : "gap-2"}`}>
                    <input
                      ref={galleryFileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setNewPhotoUrl(URL.createObjectURL(file));
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => galleryFileInputRef.current?.click()}
                      className={
                        isModern
                          ? "h-9 rounded-md border-white/[0.08] bg-[#0F0F0F] text-foreground hover:bg-white/[0.06] hover:text-foreground transition-colors duration-150 gap-2 [&_svg]:mr-0"
                          : "rounded-lg h-10"
                      }
                    >
                      <ImagePlus className="w-4 h-4 shrink-0" strokeWidth={isModern ? 1.7 : 2} /> Escolher imagem
                    </Button>
                    <Input
                      value={newPhotoCaption}
                      onChange={(e) => setNewPhotoCaption(e.target.value)}
                      placeholder="Legenda (opcional)"
                      className={
                        isModern
                          ? "h-9 rounded-md flex-1 min-w-[160px] border-white/[0.08] bg-[#0F0F0F] focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-0 transition-shadow duration-150"
                          : "rounded-lg h-10 flex-1 min-w-[160px]"
                      }
                    />
                    <select
                      value={newPhotoCategory}
                      onChange={(e) => setNewPhotoCategory(e.target.value as GalleryCategory)}
                      className={
                        isModern
                          ? "rounded-md bg-[#0F0F0F] border border-white/[0.08] px-2.5 py-1.5 text-sm h-9 text-foreground"
                          : "rounded-lg bg-background border border-border px-3 py-2 text-sm h-10"
                      }
                    >
                      {GALLERY_CATEGORIES.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                    <Input
                      value={newPhotoTags}
                      onChange={(e) => setNewPhotoTags(e.target.value)}
                      placeholder="#degrade #barba (opcional)"
                      className={
                        isModern
                          ? "h-9 rounded-md flex-1 min-w-[140px] border-white/[0.08] bg-[#0F0F0F] focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-0 transition-shadow duration-150"
                          : "rounded-lg h-10 flex-1 min-w-[140px]"
                      }
                    />
                    <Button
                      type="button"
                      onClick={addPhoto}
                      className={
                        isModern
                          ? "bg-primary text-primary-foreground hover:bg-primary/90 rounded-sm h-9 min-h-9 shrink-0 px-4 font-semibold gap-2 [&_svg]:mr-0 transition-colors duration-150 active:opacity-90"
                          : "bg-primary text-primary-foreground hover:bg-primary/90 rounded-md h-10 min-h-10 shrink-0 px-5 sm:px-6 font-semibold gap-2 [&_svg]:mr-0"
                      }
                    >
                      <Plus className="w-4 h-4 shrink-0" /> Adicionar
                    </Button>
                  </div>
                ) : (
                  <div className={`flex flex-col ${isModern ? "gap-1.5" : "gap-2"}`}>
                    <div className={`flex flex-wrap items-center ${isModern ? "gap-1.5" : "gap-2"}`}>
                      <input ref={beforeFileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) setBeforeAfterUrls((u) => ({ ...u, before: URL.createObjectURL(f) })); }} />
                      <input ref={afterFileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) setBeforeAfterUrls((u) => ({ ...u, after: URL.createObjectURL(f) })); }} />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => beforeFileRef.current?.click()}
                        className={isModern ? "h-8 rounded-md border-white/[0.08] bg-[#0F0F0F] text-xs transition-colors duration-150" : ""}
                      >
                        Antes
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => afterFileRef.current?.click()}
                        className={isModern ? "h-8 rounded-md border-white/[0.08] bg-[#0F0F0F] text-xs transition-colors duration-150" : ""}
                      >
                        Depois
                      </Button>
                      {beforeAfterUrls.before && <span className="text-xs text-muted-foreground inline-flex items-center gap-1"><Check className="w-3 h-3 text-emerald-500" /> Antes</span>}
                      {beforeAfterUrls.after && <span className="text-xs text-muted-foreground inline-flex items-center gap-1"><Check className="w-3 h-3 text-emerald-500" /> Depois</span>}
                      <Input
                        value={newPhotoCaption}
                        onChange={(e) => setNewPhotoCaption(e.target.value)}
                        placeholder="Legenda (opcional)"
                        className={
                          isModern
                            ? "h-8 rounded-md flex-1 min-w-[120px] border-white/[0.08] bg-[#0F0F0F] focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-0 text-sm"
                            : "rounded-lg h-9 flex-1 min-w-[120px]"
                        }
                      />
                      <Button
                        type="button"
                        onClick={addPhoto}
                        className={
                          isModern
                            ? "bg-primary text-primary-foreground hover:bg-primary/90 rounded-sm h-8 min-h-8 shrink-0 px-3 text-xs font-semibold transition-colors duration-150 active:opacity-90"
                            : "bg-primary text-primary-foreground hover:bg-primary/90 rounded-md h-10 min-h-10 shrink-0 px-5 sm:px-6 text-sm font-semibold"
                        }
                      >
                        Adicionar Antes/Depois
                      </Button>
                    </div>
                    <p className={`text-muted-foreground ${isModern ? "text-[11px]" : "text-xs"}`}>
                      {isModern ? "Compare antes e depois na mesma publicação." : "Antes/Depois converte muito: o cliente vê o resultado na hora."}
                    </p>
                  </div>
                )}
              </motion.div>

              <p
                className={`flex items-center gap-1.5 ${isModern ? "text-[11px] text-muted-foreground" : "text-xs text-muted-foreground"}`}
              >
                <Lightbulb className={`shrink-0 ${isModern ? "w-3 h-3 text-primary" : "w-3.5 h-3.5 text-primary"}`} />
                {isModern ? "Fotos recentes tendem a performar melhor no perfil." : "Fotos recentes performam mais. Mantenha a galeria atualizada."}
              </p>

              {filteredGallery.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: isModern ? 0.12 : undefined }}
                  className={
                    isModern
                      ? "rounded-lg border border-dashed border-white/[0.12] bg-[#0F0F0F]/80 p-8 flex flex-col items-center justify-center gap-3 text-center"
                      : "rounded-xl border border-dashed border-border bg-secondary/30 p-12 flex flex-col items-center justify-center gap-4 text-center"
                  }
                >
                  {isModern ? (
                    <ImagePlus className="w-8 h-8 text-muted-foreground shrink-0" aria-hidden />
                  ) : (
                    <div className="rounded-full bg-primary/10 p-4">
                      <ImagePlus className="w-12 h-12 text-primary" />
                    </div>
                  )}
                  <div>
                    <p className={`font-medium text-foreground ${isModern ? "text-sm" : ""}`}>
                      {isModern ? "Você ainda não adicionou fotos" : "Nenhuma foto ainda"}
                    </p>
                    <p className={`text-muted-foreground max-w-sm mt-1 ${isModern ? "text-xs" : "text-sm"}`}>
                      {isModern
                        ? "Adicione fotos para começar a atrair clientes."
                        : "Adicione fotos para atrair mais clientes e vender o corte antes deles sentarem na cadeira."}
                    </p>
                  </div>
                  <motion.div
                    whileHover={isModern ? { opacity: 0.95 } : { scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: isModern ? 0.12 : undefined }}
                    className="inline-flex max-w-full w-full sm:w-auto justify-center"
                  >
                    <Button
                      type="button"
                      onClick={() => {
                        setGalleryFilter("todos");
                        setNewPhotoKind("single");
                        galleryFileInputRef.current?.click();
                      }}
                      variant={isModern ? "default" : "outlineGold"}
                      className={
                        isModern
                          ? "mt-1 h-9 min-h-9 rounded-md px-4 text-sm font-semibold gap-2 w-full sm:w-auto transition-colors duration-150 hover:bg-primary/90 active:opacity-90 [&_svg]:size-4 [&_svg]:shrink-0"
                          : "mt-2 h-12 min-h-12 rounded-md px-6 sm:px-8 text-base font-semibold gap-2 w-full sm:w-auto [&_svg]:size-5 [&_svg]:shrink-0"
                      }
                    >
                      <ImagePlus /> {isModern ? "Adicionar foto" : "Adicionar primeira foto"}
                    </Button>
                  </motion.div>
                </motion.div>
              ) : (
                <motion.div
                  className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 ${isModern ? "gap-2" : "gap-3"}`}
                  variants={listVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {filteredGallery.map((photo) => {
                    const globalIndex = gallery.indexOf(photo);
                    const category = getPhotoCategory(photo);
                    return (
                      <motion.div
                        key={`${photo.url}-${globalIndex}`}
                        variants={itemVariants}
                        whileHover={isModern ? { y: -1 } : { y: -2, scale: 1.01 }}
                        transition={{ duration: isModern ? 0.12 : undefined }}
                        className={`relative group overflow-hidden border border-border bg-secondary aspect-square ${isModern ? "rounded-lg border-white/[0.08]" : "rounded-xl"}`}
                      >
                        {photo.beforeAfter ? (
                          <BeforeAfterSlider beforeUrl={photo.beforeAfter.beforeUrl} afterUrl={photo.beforeAfter.afterUrl} alt={photo.caption} />
                        ) : (
                          <img
                            src={photo.url}
                            alt={photo.caption || "Foto"}
                            className="w-full h-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect fill='%23333' width='100' height='100'/%3E%3Ctext x='50' y='55' fill='%23888' text-anchor='middle' font-size='12'%3EImagem%3C/text%3E%3C/svg%3E"; }}
                          />
                        )}
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-medium bg-card/90 text-foreground">
                          {GALLERY_CATEGORIES.find((c) => c.value === category)?.label ?? category}
                        </span>
                        {photo.isHighlight && (
                          <span className="absolute top-2 right-10 flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary/90 text-primary-foreground">
                            <Star className="w-3 h-3" strokeWidth={isModern ? 1.7 : 2} /> Destaque
                          </span>
                        )}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                          {photo.caption && <p className="text-xs text-white truncate mb-1">{photo.caption}</p>}
                          <div className="flex items-center gap-2 text-[10px] text-white/90 mb-1">
                            <span className="flex items-center gap-0.5"><Eye className="w-3 h-3" /> {photo.viewCount ?? Math.max(5, (globalIndex + 1) * 8)}</span>
                            <span className="flex items-center gap-0.5"><BarChart2 className="w-3 h-3" /> {photo.clickCount ?? Math.max(1, globalIndex + 1)} cliques</span>
                          </div>
                          {photo.tags && photo.tags.length > 0 && (
                            <div className="flex flex-wrap gap-0.5 mb-1">
                              {photo.tags.slice(0, 3).map((t) => (
                                <span key={t} className="text-[10px] text-primary-foreground/80">#{t}</span>
                              ))}
                            </div>
                          )}
                          {photo.createdAt && (
                            <p className="text-[10px] text-white/70">Postada {new Date(photo.createdAt).toLocaleDateString("pt-BR")}</p>
                          )}
                          <Link to={`/cliente/barbearia/${barbershopId}`} target="_blank" className="text-[10px] font-medium text-primary hover:underline flex items-center gap-0.5 mt-0.5">
                            <Calendar className="w-3 h-3" /> Agendar esse corte
                          </Link>
                          <div className="absolute top-2 right-2 flex gap-1">
                            <Button type="button" variant="secondary" size="icon" className="h-8 w-8" onClick={() => { setEditPhotoCaption(photo.caption); setEditPhotoCategory(getPhotoCategory(photo)); setEditPhotoIndex(globalIndex); }} title="Editar">
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button type="button" variant="secondary" size="icon" className="h-8 w-8" onClick={() => setPhotoHighlight(globalIndex, !photo.isHighlight)} title={photo.isHighlight ? "Remover destaque" : "Definir como destaque"}>
                              <Star className={`w-3.5 h-3.5 ${photo.isHighlight ? "fill-primary text-primary" : ""}`} strokeWidth={isModern ? 1.7 : 2} />
                            </Button>
                            <Button type="button" variant="destructive" size="icon" className="h-8 w-8" onClick={() => removePhoto(globalIndex)} title="Excluir">
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}

              {/* Modal edição rápida */}
              {editPhotoIndex !== null && gallery[editPhotoIndex] && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: isModern ? 0.12 : undefined }}
                  className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
                  onClick={() => setEditPhotoIndex(null)}
                >
                  <motion.div
                    initial={{ scale: 0.98 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: isModern ? 0.15 : undefined }}
                    className={
                      isModern
                        ? "bg-[#111111] border border-white/[0.08] rounded-xl p-4 max-w-md w-full shadow-none"
                        : "bg-card border border-border rounded-2xl p-5 max-w-md w-full shadow-xl"
                    }
                    onClick={(e) => e.stopPropagation()}
                  >
                    <h3 className={`font-semibold text-foreground mb-3 ${isModern ? "text-sm" : ""}`}>Editar foto</h3>
                    <Input
                      value={editPhotoCaption}
                      onChange={(e) => setEditPhotoCaption(e.target.value)}
                      placeholder="Legenda"
                      className={
                        isModern
                          ? "mb-2 rounded-md h-9 border-white/[0.08] bg-[#0F0F0F] focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-0"
                          : "mb-3 rounded-lg"
                      }
                    />
                    <select
                      value={editPhotoCategory}
                      onChange={(e) => setEditPhotoCategory(e.target.value as GalleryCategory)}
                      className={
                        isModern
                          ? "w-full rounded-md bg-[#0F0F0F] border border-white/[0.08] px-2.5 py-2 text-sm mb-3 h-9 text-foreground"
                          : "w-full rounded-lg bg-background border border-border px-3 py-2 text-sm mb-4"
                      }
                    >
                      {GALLERY_CATEGORIES.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                    <div className={`flex justify-end ${isModern ? "gap-1.5" : "gap-2"}`}>
                      <Button type="button" variant="outline" className={isModern ? "rounded-md h-9 border-white/[0.08] bg-transparent transition-colors duration-150" : ""} onClick={() => setEditPhotoIndex(null)}>
                        Cancelar
                      </Button>
                      <Button
                        type="button"
                        className={
                          isModern
                            ? "rounded-md h-9 px-4 bg-primary text-primary-foreground transition-colors duration-150 hover:bg-primary/90 active:opacity-90"
                            : "bg-primary text-primary-foreground"
                        }
                        onClick={() => updatePhotoMeta(editPhotoIndex, { caption: editPhotoCaption, category: editPhotoCategory })}
                      >
                        Salvar
                      </Button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {offer?.enabled && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-xl p-4 border border-primary/30 bg-primary/5 flex items-start gap-3"
          >
            <Gift className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div className="min-w-0">
              <h3 className="font-semibold text-foreground text-sm">Oferta de primeira visita ativa</h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                <strong className="text-foreground">{offer.discountPercent}% de desconto</strong> na primeira visita.
                {offer.description && ` ${offer.description}`}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Editar em <Link to="/barbeiro/perfil" className="text-primary underline">Perfil</Link> → Fidelidade.
              </p>
            </div>
          </motion.div>
        )}
      </motion.div>
    </DashboardLayout>
  );
};

export default BarberMyShop;
