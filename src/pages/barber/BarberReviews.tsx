import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, User, Share2, QrCode, AlertTriangle, Sparkles, Send, Quote, Crown, LayoutDashboard } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { getReviews, replyToReview, type Review } from "@/lib/reviews";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

const BarberReviews = () => {
  const { user } = useAuth();
  const { identity } = useTheme();
  const isModern = identity === "modern";
  const [reviews, setReviews] = useState<Review[]>([]);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [showQRModal, setShowQRModal] = useState(false);
  const barbershopId = user?.role === "barbeiro" ? user.barbershopId : undefined;

  useEffect(() => {
    if (barbershopId != null) {
      setReviews(getReviews(barbershopId));
    }
  }, [barbershopId]);

  const average = reviews.length
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : null;
  const count = reviews.length;

  const ratingBuckets = useMemo(() => {
    const map: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach((review) => {
      map[review.rating] = (map[review.rating] ?? 0) + 1;
    });
    return map;
  }, [reviews]);

  const lowRatings = reviews.filter((review) => review.rating <= 2).length;

  const insights = useMemo(() => {
    if (reviews.length === 0) return null;
    const corpus = reviews.map((r) => r.comment.toLowerCase()).join(" ");
    const items: { type: "positive" | "improvement"; text: string }[] = [];
    
    if (corpus.includes("pontual") || corpus.includes("horário")) {
      items.push({ type: "positive", text: "Pontualidade reconhecida pelos clientes" });
    }
    if (corpus.includes("atendimento") || corpus.includes("simpatia")) {
      items.push({ type: "positive", text: "Atendimento caloroso bem avaliado" });
    }
    if (corpus.includes("corte") || corpus.includes("barba") || corpus.includes("acabamento")) {
      items.push({ type: "positive", text: "Qualidade técnica do serviço destacada" });
    }
    if (corpus.includes("ambiente") || corpus.includes("espaço") || corpus.includes("conforto")) {
      items.push({ type: "positive", text: "Ambiente agradável mencionado" });
    }
    if (corpus.includes("espera") || corpus.includes("demora") || corpus.includes("fila")) {
      items.push({ type: "improvement", text: "Tempo de espera é um ponto a observar" });
    }
    if (corpus.includes("preço") || corpus.includes("custo") || corpus.includes("caro")) {
      items.push({ type: "improvement", text: "Percepção de valor pode ser reforçada" });
    }
    
    return items.length > 0 ? items : null;
  }, [reviews]);

  const reviewLink = useMemo(
    () => `${window.location.origin}/cliente/buscar?shop=${barbershopId ?? ""}&review=1`,
    [barbershopId],
  );

  const copyReviewLink = async () => {
    try {
      await navigator.clipboard.writeText(reviewLink);
      toast({ title: "Link copiado", description: "Compartilhe com seus clientes após o atendimento." });
    } catch {
      toast({ title: "Não foi possível copiar", variant: "destructive" });
    }
  };

  const saveReply = (review: Review) => {
    const draft = (replyDrafts[review.id] || "").trim();
    if (!draft) {
      toast({ title: "Escreva uma resposta antes de enviar.", variant: "destructive" });
      return;
    }
    replyToReview(review.id, draft);
    if (barbershopId != null) {
      setReviews(getReviews(barbershopId));
    }
    toast({ title: "Resposta publicada", description: "Sua resposta fortalece a relação com o cliente." });
  };

  const getReviewTags = (review: Review) => {
    const text = review.comment.toLowerCase();
    const tags: string[] = [];
    if (text.includes("atendimento")) tags.push("Atendimento");
    if (text.includes("corte")) tags.push("Corte");
    if (text.includes("barba")) tags.push("Barba");
    if (text.includes("ambiente")) tags.push("Ambiente");
    if (text.includes("pontual")) tags.push("Pontualidade");
    if (tags.length === 0) tags.push("Experiência");
    return tags.slice(0, 3);
  };

  const barWidth = (stars: number) => {
    if (!count) return "0%";
    return `${Math.round((ratingBuckets[stars] / count) * 100)}%`;
  };

  const getRatingLabel = (rating: number) => {
    if (rating >= 4.8) return "Excepcional";
    if (rating >= 4.5) return "Excelente";
    if (rating >= 4.0) return "Muito bom";
    if (rating >= 3.5) return "Bom";
    if (rating >= 3.0) return "Regular";
    return "A melhorar";
  };

  const ReputationHeader = () => (
    <div className={`text-center max-w-2xl mx-auto ${isModern ? "mb-8" : "mb-10"}`}>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${
          isModern 
            ? "bg-primary/10 border border-primary/20" 
            : "bg-[hsl(var(--gold)/0.08)] border border-[hsl(var(--gold)/0.2)]"
        } mb-3`}
      >
        {isModern ? (
          <LayoutDashboard className="w-3.5 h-3.5 text-primary" />
        ) : (
          <Crown className="w-3.5 h-3.5 text-[hsl(var(--gold))]" />
        )}
        <span className={`text-[10px] font-bold tracking-[0.2em] uppercase ${
          isModern ? "text-primary" : "text-[hsl(var(--gold))]"
        }`}>
          {isModern ? "Métricas de Qualidade" : "Prestígio & Confiança"}
        </span>
      </motion.div>
      <h1 className={`${
        isModern ? "text-2xl lg:text-3xl" : "text-3xl lg:text-4xl"
      } font-display font-semibold text-foreground tracking-tight mb-3`}>
        {isModern ? "Reputação da barbearia" : "Avaliações da sua casa"}
      </h1>
      <p className={`text-muted-foreground ${isModern ? "text-sm" : "text-base"} leading-relaxed`}>
        {isModern 
          ? "Acompanhe sua reputação e reúna feedback dos clientes." 
          : "A voz dos clientes fortalece a casa e gera novos agendamentos."}
      </p>
    </div>
  );

  const MasterReputationBlock = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: isModern ? 0.3 : 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`relative overflow-hidden rounded-3xl border border-[hsl(var(--border))] ${
        isModern 
          ? "bg-card p-5 lg:p-6 shadow-sm" 
          : "bg-gradient-to-b from-[hsl(var(--card))] to-[hsl(var(--card)/0.95)] p-6 lg:p-8 shadow-2xl"
      }`}
    >
      {/* Decorative elements for Vintage feel */}
      {!isModern && (
        <>
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[hsl(var(--gold)/0.3)] to-transparent" />
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-[hsl(var(--gold)/0.02)] rounded-full blur-3xl" />
        </>
      )}

      {reviews.length === 0 ? (
        <div className={`relative z-10 text-center max-w-xl mx-auto ${isModern ? "py-2" : ""}`}>
          <div className={`inline-flex items-center justify-center ${isModern ? "w-12 h-12 mb-4" : "w-13 h-13 mb-5"} rounded-xl ${
            isModern 
              ? "bg-primary/5 border border-primary/10" 
              : "bg-[hsl(var(--gold)/0.05)] border border-[hsl(var(--gold)/0.15)] shadow-inner"
          }`}>
            <Quote className={`${isModern ? "w-5 h-5 text-primary" : "text-[hsl(var(--gold))] w-5.5 h-5.5"}`} />
          </div>
          <h2 className={`${isModern ? "text-lg lg:text-xl" : "text-xl lg:text-2xl"} font-display font-semibold text-foreground mb-3 tracking-tight`}>
            {isModern ? "Inicie sua coleta de feedback" : "Sua reputação começa na próxima opinião"}
          </h2>
          <p className={`text-muted-foreground ${isModern ? "text-xs" : "text-sm lg:text-base"} leading-relaxed mb-6 px-4`}>
            {isModern 
              ? "Compartilhe seu link de avaliação após cada atendimento para monitorar o nível de serviço e atrair novos clientes."
              : "Cada avaliação fortalece a confiança na sua barbearia. Compartilhe seu link após o atendimento e comece a reunir as primeiras recomendações."}
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 px-2">
            <Button
              onClick={() => void copyReviewLink()}
              size={isModern ? "sm" : "default"}
              className={`w-full sm:w-auto font-semibold px-8 ${
                isModern 
                  ? "bg-primary text-white hover:bg-primary/90 h-10 text-xs" 
                  : "bg-[hsl(var(--gold))] text-[hsl(var(--gold-dark))] hover:bg-[hsl(var(--gold-light))] h-11 shadow-[0_10px_30px_-10px_hsl(var(--gold)/0.4)]"
              } rounded-xl transition-all duration-300`}
            >
              <Share2 className="w-3.5 h-3.5 mr-2" />
              {isModern ? "Copiar link de avaliação" : "Compartilhar link de avaliação"}
            </Button>
            <Button
              variant="outline"
              size={isModern ? "sm" : "default"}
              onClick={() => setShowQRModal(true)}
              className={`w-full sm:w-auto border-[hsl(var(--border))] ${
                isModern 
                  ? "hover:bg-primary/5 hover:border-primary/30 h-10 text-xs" 
                  : "hover:border-[hsl(var(--gold)/0.4)] hover:bg-[hsl(var(--gold)/0.03)] h-11"
              } rounded-xl transition-all duration-300`}
            >
              <QrCode className="w-3.5 h-3.5 mr-2" />
              Gerar QR code
            </Button>
          </div>
          <p className={`mt-5 text-[11px] text-muted-foreground/60 ${isModern ? "not-italic" : "italic font-medium"}`}>
            Dica: envie pelo WhatsApp logo após finalizar o atendimento para aumentar a chance de resposta.
          </p>
        </div>
      ) : (
        <div className="relative z-10">
          <div className={`grid grid-cols-1 lg:grid-cols-12 ${isModern ? "gap-6" : "gap-10"} items-center`}>
            <div className="lg:col-span-5 text-center lg:text-left">
              <div className="inline-flex items-baseline gap-2 mb-2">
                <span className={`${isModern ? "text-5xl" : "text-6xl"} font-display font-bold text-foreground tracking-tighter`}>
                  {average}
                </span>
                <span className={`${isModern ? "text-lg" : "text-xl"} text-muted-foreground font-medium`}>/ 5.0</span>
              </div>
              
              <div className={`flex items-center justify-center lg:justify-start gap-1.5 ${isModern ? "mb-2" : "mb-3"}`}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`${isModern ? "w-4 h-4" : "w-5 h-5"} ${
                      star <= Math.round(Number(average))
                        ? isModern ? "text-primary fill-primary" : "text-[hsl(var(--gold))] fill-[hsl(var(--gold))]"
                        : "text-muted-foreground/20"
                    }`}
                  />
                ))}
              </div>
              
              <h3 className={`${isModern ? "text-lg" : "text-xl"} font-display font-semibold text-foreground mb-1`}>
                {getRatingLabel(Number(average))}
              </h3>
              <p className={`text-muted-foreground ${isModern ? "text-xs mb-5" : "text-sm mb-6"}`}>
                {isModern 
                  ? `Sua média atual reflete as ${count} avaliações recebidas e ajuda a fortalecer confiança e conversão.`
                  : `Sua barbearia possui uma reputação sólida baseada em ${count} avaliações reais.`}
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <Button
                  onClick={() => void copyReviewLink()}
                  size={isModern ? "sm" : "default"}
                  className={`w-full sm:w-auto font-semibold rounded-xl px-6 ${
                    isModern 
                      ? "bg-primary text-white hover:bg-primary/90 h-10 text-xs" 
                      : "bg-[hsl(var(--gold))] text-[hsl(var(--gold-dark))] hover:bg-[hsl(var(--gold-light))] h-11 shadow-lg"
                  }`}
                >
                  <Share2 className="w-3.5 h-3.5 mr-2" />
                  {isModern ? "Copiar link" : "Compartilhar link"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowQRModal(true)}
                  size={isModern ? "sm" : "default"}
                  className={`w-full sm:w-auto border-[hsl(var(--border))] rounded-xl px-6 ${
                    isModern 
                      ? "hover:bg-primary/5 hover:border-primary/30 h-10 text-xs" 
                      : "hover:border-[hsl(var(--gold)/0.4)] h-11"
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5 mr-2" />
                  QR Code
                </Button>
              </div>
            </div>

            <div className={`lg:col-span-7 border-t lg:border-t-0 lg:border-l border-[hsl(var(--border))] ${isModern ? "pt-6 lg:pt-0 lg:pl-6" : "pt-10 lg:pt-0 lg:pl-10"}`}>
              <div className={`space-y-3 max-w-md mx-auto lg:mx-0 ${isModern ? "scale-[0.9] origin-left" : "scale-[0.95] lg:scale-100 origin-left"}`}>
                {[5, 4, 3, 2, 1].map((stars) => (
                  <div key={stars} className="flex items-center gap-4 group">
                    <div className="flex items-center gap-1.5 w-10 shrink-0">
                      <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">{stars}</span>
                      <Star className={`w-3.5 h-3.5 ${isModern ? "text-primary fill-primary" : "text-[hsl(var(--gold))] fill-[hsl(var(--gold))]"}`} />
                    </div>
                    <div className="flex-1 h-2 rounded-full bg-[hsl(var(--muted))] overflow-hidden border border-[hsl(var(--border)/0.5)]">
                      <motion.div
                        className={`h-full rounded-full ${
                          isModern 
                            ? "bg-primary" 
                            : "bg-gradient-to-r from-[hsl(var(--gold-dark))] via-[hsl(var(--gold))] to-[hsl(var(--gold-light))]"
                        }`}
                        initial={{ width: 0 }}
                        animate={{ width: barWidth(stars) }}
                        transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 + (5 - stars) * 0.1 }}
                      />
                    </div>
                    <span className="w-10 text-right text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                      {Math.round((ratingBuckets[stars] / count) * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );

  const InsightsAndAlerts = () => {
    if (reviews.length === 0 || (!insights && lowRatings === 0)) return null;
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className={`grid grid-cols-1 md:grid-cols-2 ${isModern ? "gap-4" : "gap-6"}`}
      >
        {insights && insights.length > 0 && (
          <div className={`rounded-2xl border border-[hsl(var(--border))] ${isModern ? "bg-card p-5" : "bg-[hsl(var(--card)/0.5)] p-6 backdrop-blur-sm"}`}>
            <div className={`flex items-center gap-3 ${isModern ? "mb-4" : "mb-5"}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                isModern 
                  ? "bg-primary/5 border-primary/10" 
                  : "bg-[hsl(var(--gold)/0.1)] border-[hsl(var(--gold)/0.2)]"
              }`}>
                <Sparkles className={`w-5 h-5 ${isModern ? "text-primary" : "text-[hsl(var(--gold))]"}`} />
              </div>
              <h3 className={`font-display font-semibold text-foreground ${isModern ? "text-sm" : ""}`}>
                {isModern ? "Análise de Sentimento" : "Destaques da Experiência"}
              </h3>
            </div>
            <ul className={isModern ? "space-y-2" : "space-y-3"}>
              {insights.map((insight, idx) => (
                <li key={idx} className={`flex items-start gap-3 text-sm text-muted-foreground leading-relaxed`}>
                  <div className={`mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full ${
                    insight.type === "positive" 
                      ? isModern ? "bg-primary" : "bg-[hsl(var(--gold))]" 
                      : "bg-amber-500"
                  }`} />
                  {insight.text}
                </li>
              ))}
            </ul>
          </div>
        )}

        {lowRatings > 0 && (
          <div className={`rounded-2xl border border-amber-500/20 bg-amber-500/5 ${isModern ? "p-5" : "p-6"} backdrop-blur-sm`}>
            <div className={`flex items-center gap-3 ${isModern ? "mb-3" : "mb-4"}`}>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              </div>
              <h3 className={`font-display font-semibold text-foreground ${isModern ? "text-sm" : ""}`}>Atenção Crítica</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Você possui <span className="text-amber-500 font-bold">{lowRatings}</span> {lowRatings === 1 ? "avaliação" : "avaliações"} com nota baixa que ainda não foram respondidas ou requerem atenção. 
              {isModern ? " Responda para manter a taxa de conversão." : " Responder prontamente demonstra profissionalismo e compromisso com a excelência."}
            </p>
          </div>
        )}
      </motion.div>
    );
  };

  const ReviewsList = () => {
    if (reviews.length === 0) return null;
    
    return (
      <div className={`space-y-6 ${isModern ? "pt-2" : "pt-3"}`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className={`font-display font-semibold text-foreground ${isModern ? "text-lg" : "text-lg"}`}>
            {isModern ? "Feed de Avaliações" : "Voz dos Clientes"}
          </h3>
          <div className={`h-px flex-1 ${isModern ? "bg-border" : "bg-gradient-to-r from-[hsl(var(--border))] to-transparent"} ml-6`} />
        </div>
        
        <AnimatePresence>
          {reviews.map((review, index) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              className={`group relative rounded-2xl border ${
                isModern 
                  ? "border-border bg-card p-4 hover:border-primary/30" 
                  : "border-[hsl(var(--border))] bg-[hsl(var(--card)/0.3)] p-5 hover:bg-[hsl(var(--card)/0.6)] hover:border-[hsl(var(--gold)/0.3)]"
              } transition-all duration-300`}
            >
              <div className={`flex flex-col sm:flex-row ${isModern ? "gap-4" : "gap-5"}`}>
                <div className="flex sm:flex-col items-center gap-3 shrink-0">
                  <div className={`${isModern ? "w-12 h-12" : "w-13 h-13"} rounded-full flex items-center justify-center border shadow-sm ${
                    isModern 
                      ? "bg-muted border-border" 
                      : "bg-gradient-to-br from-[hsl(var(--gold)/0.15)] to-transparent border-[hsl(var(--gold)/0.2)]"
                  }`}>
                    <User className={`${isModern ? "w-5 h-5" : "w-5.5 h-5.5"} ${isModern ? "text-muted-foreground" : "text-[hsl(var(--gold))]"}`} />
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${isModern ? "mb-2" : "mb-3"}`}>
                    <div>
                      <h4 className={`font-display font-semibold ${isModern ? "text-base" : "text-base"} text-foreground transition-colors ${
                        isModern ? "group-hover:text-primary" : "group-hover:text-[hsl(var(--gold-light))]"
                      }`}>
                        {review.authorName}
                      </h4>
                      <div className="flex items-center gap-3 mt-1">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`${isModern ? "w-3 h-3" : "w-3 h-3"} ${
                                star <= review.rating
                                  ? isModern ? "text-primary fill-primary" : "text-[hsl(var(--gold))] fill-[hsl(var(--gold))]"
                                  : "text-muted-foreground/20"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                          {format(new Date(review.createdAt), "d 'de' MMMM, yyyy", { locale: ptBR })}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {getReviewTags(review).map((tag) => (
                        <span
                          key={`${review.id}_${tag}`}
                          className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md border transition-all ${
                            isModern 
                              ? "border-border bg-muted/30 text-muted-foreground group-hover:border-primary/20 group-hover:text-primary" 
                              : "border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.5)] text-muted-foreground group-hover:border-[hsl(var(--gold)/0.2)] group-hover:text-[hsl(var(--gold))]"
                          }`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {review.comment && (
                    <div className={`relative ${isModern ? "mb-3" : "mb-5"}`}>
                      {!isModern && <Quote className="absolute -top-2 -left-3 w-7 h-7 text-[hsl(var(--gold)/0.1)] -z-10" />}
                      <p className={`text-muted-foreground leading-relaxed ${isModern ? "text-sm" : "text-sm"} ${isModern ? "" : "italic"}`}>
                        &ldquo;{review.comment}&rdquo;
                      </p>
                    </div>
                  )}

                  {review.photoUrl && (
                    <div className={isModern ? "mb-3" : "mb-5"}>
                      <img
                        src={review.photoUrl}
                        alt="Foto do serviço"
                        className={`${isModern ? "w-24 h-24" : "w-28 h-28"} rounded-xl object-cover border border-[hsl(var(--border))] transition-transform duration-500 ${isModern ? "hover:scale-102" : "hover:scale-105"}`}
                      />
                    </div>
                  )}

                  <div className={`${isModern ? "pt-3" : "pt-4"} border-t border-[hsl(var(--border)/0.5)]`}>
                    {review.barberReply ? (
                      <div className={`rounded-xl border ${isModern ? "p-3" : "p-3"} ${
                        isModern 
                          ? "bg-muted/30 border-border" 
                          : "bg-[hsl(var(--gold)/0.03)] border-[hsl(var(--gold)/0.1)]"
                      }`}>
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`w-1 h-1 rounded-full ${isModern ? "bg-primary" : "bg-[hsl(var(--gold))]"}`} />
                          <span className={`text-[9px] font-bold uppercase tracking-widest ${isModern ? "text-primary" : "text-[hsl(var(--gold))]"}`}>
                            {isModern ? "Resposta Oficial" : "Sua Resposta"}
                          </span>
                        </div>
                        <p className={`text-muted-foreground leading-relaxed ${isModern ? "text-xs" : "text-xs"} ${isModern ? "" : "italic"}`}>
                          {review.barberReply}
                        </p>
                      </div>
                    ) : (
                      <div className="flex gap-3">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            placeholder={isModern ? "Responder feedback..." : "Agradeça ao cliente ou responda ao feedback..."}
                            className={`w-full ${isModern ? "h-10 text-xs" : "h-10 text-xs"} rounded-xl border bg-transparent px-4 py-2 focus:outline-none transition-all ${
                              isModern 
                                ? "border-border focus:border-primary/50 focus:ring-primary/10" 
                                : "border-[hsl(var(--border))] focus:border-[hsl(var(--gold)/0.5)] focus:ring-[hsl(var(--gold)/0.2)]"
                            }`}
                            value={replyDrafts[review.id] ?? ""}
                            onChange={(e) =>
                              setReplyDrafts((prev) => ({
                                ...prev,
                                [review.id]: e.target.value,
                              }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                saveReply(review);
                              }
                            }}
                          />
                        </div>
                        <Button
                          size="icon"
                          onClick={() => saveReply(review)}
                          className={`${isModern ? "w-10 h-10" : "w-10 h-10"} rounded-xl shadow-lg shrink-0 ${
                            isModern 
                              ? "bg-primary text-white hover:bg-primary/90" 
                              : "bg-[hsl(var(--gold))] text-[hsl(var(--gold-dark))] hover:bg-[hsl(var(--gold-light))]"
                          }`}
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    );
  };

  const QRModal = () => {
    if (!showQRModal) return null;
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-hidden">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
          onClick={() => setShowQRModal(false)}
        />
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className={`relative w-full max-w-md rounded-3xl border ${
            isModern 
              ? "border-border bg-card shadow-xl" 
              : "border-[hsl(var(--gold)/0.2)] bg-[hsl(var(--card))] shadow-2xl"
          } p-8 overflow-hidden`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Decorative Corner */}
          {!isModern && <div className="absolute -top-12 -right-12 w-32 h-32 bg-[hsl(var(--gold)/0.05)] rounded-full blur-2xl" />}
          
          <div className="text-center relative z-10">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 border ${
              isModern 
                ? "bg-primary/5 border-primary/10" 
                : "bg-[hsl(var(--gold)/0.1)] border-[hsl(var(--gold)/0.2)]"
            }`}>
              <QrCode className={`w-8 h-8 ${isModern ? "text-primary" : "text-[hsl(var(--gold))]"}`} />
            </div>
            
            <h3 className="text-2xl font-display font-semibold text-foreground mb-3">
              QR Code de Avaliação
            </h3>
            <p className="text-muted-foreground text-sm mb-8 leading-relaxed px-4">
              Apresente este código aos seus clientes no balcão ou nas bancadas para que avaliem seu serviço instantaneamente.
            </p>
            
            <div className="relative group mb-8">
              <div className={`absolute -inset-1 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500 ${
                isModern ? "bg-primary" : "bg-gradient-to-r from-[hsl(var(--gold-dark))] to-[hsl(var(--gold-light))]"
              }`} />
              <div className="relative w-56 h-56 mx-auto rounded-2xl border-4 border-white bg-white p-4 shadow-xl">
                {/* Simplified QR Placeholder with premium feel */}
                <div className={`w-full h-full rounded-lg relative overflow-hidden opacity-90 ${
                  isModern ? "bg-slate-900" : "bg-[hsl(var(--foreground))]"
                }`}>
                  <div className="absolute inset-2 grid grid-cols-8 grid-rows-8 gap-1">
                    {Array.from({ length: 64 }).map((_, i) => {
                      const isPattern = [0, 1, 2, 7, 8, 9, 14, 15, 16, 23, 24, 31, 32, 39, 40, 47, 48, 49, 54, 55, 56, 61, 62, 63].includes(i);
                      return (
                        <div
                          key={i}
                          className={`rounded-sm transition-all duration-300 ${
                            isPattern ? "bg-white" : Math.random() > 0.4 ? "bg-white/20" : "bg-transparent"
                          }`}
                        />
                      );
                    })}
                  </div>
                  {/* QR Pattern Squares */}
                  <div className="absolute top-2 left-2 w-8 h-8 border-4 border-white rounded-md" />
                  <div className="absolute top-2 right-2 w-8 h-8 border-4 border-white rounded-md" />
                  <div className="absolute bottom-2 left-2 w-8 h-8 border-4 border-white rounded-md" />
                  <div className="absolute top-4 left-4 w-4 h-4 bg-white rounded-sm" />
                  <div className="absolute top-4 right-4 w-4 h-4 bg-white rounded-sm" />
                  <div className="absolute bottom-4 left-4 w-4 h-4 bg-white rounded-sm" />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                onClick={() => {
                  void copyReviewLink();
                  setShowQRModal(false);
                }}
                className={`w-full font-bold h-12 rounded-xl ${
                  isModern 
                    ? "bg-primary text-white hover:bg-primary/90" 
                    : "bg-[hsl(var(--gold))] text-[hsl(var(--gold-dark))] hover:bg-[hsl(var(--gold-light))]"
                }`}
              >
                <Share2 className="w-4 h-4 mr-2" />
                Copiar Link Direto
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowQRModal(false)}
                className="w-full text-muted-foreground hover:text-foreground h-12"
              >
                Fechar
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  };

  return (
    <DashboardLayout userType="barbeiro">
      <div className={`max-w-5xl mx-auto px-4 ${isModern ? "py-6 lg:py-10" : "py-8 lg:py-12"}`}>
        <ReputationHeader />

        <div className={isModern ? "space-y-6" : "space-y-10"}>
          <MasterReputationBlock />
          
          <InsightsAndAlerts />
          
          <ReviewsList />
        </div>

        <AnimatePresence>
          {showQRModal && <QRModal />}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
};

export default BarberReviews;
