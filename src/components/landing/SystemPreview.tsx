import { motion } from "framer-motion";
import { Calendar, Users, Wallet, CheckCircle2 } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

const SystemPreview = () => {
  const { identity } = useTheme();

  if (identity === "modern") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.8 }}
        className="relative mt-16 max-w-5xl mx-auto"
      >
        <div className="relative rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm overflow-hidden shadow-2xl">
          <div className="border-b border-border/40 bg-muted/30 px-4 py-2 flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
            </div>
            <div className="mx-auto text-[10px] text-muted-foreground font-medium uppercase tracking-widest">
              BarberFlow Operational Panel
            </div>
          </div>
          
          <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="col-span-1 md:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  Agenda de Hoje
                </h4>
                <span className="text-[10px] text-primary font-medium py-0.5 px-2 rounded-full bg-primary/10 border border-primary/20">
                  85% Ocupada
                </span>
              </div>
              
              <div className="space-y-2">
                {[
                  { time: "09:00", customer: "Carlos Silva", service: "Corte Moderno", status: "Confirmado" },
                  { time: "10:30", customer: "Bruno Oliveira", service: "Barba & Toalha", status: "Em andamento" },
                  { time: "11:15", customer: "Rafael Souto", service: "Corte & Cor", status: "Aguardando" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-background/50 border border-border/30 hover:border-primary/30 transition-colors">
                    <span className="text-xs font-mono text-muted-foreground w-10">{item.time}</span>
                    <div className="flex-1">
                      <p className="text-xs font-medium">{item.customer}</p>
                      <p className="text-[10px] text-muted-foreground">{item.service}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                      item.status === 'Em andamento' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 
                      item.status === 'Confirmado' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                      'bg-primary/10 text-primary border border-primary/20'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-3">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-primary" />
                  Fluxo de Caixa
                </h4>
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Receita do Dia</p>
                  <p className="text-2xl font-bold text-gradient-gold">R$ 1.450,00</p>
                  <div className="mt-2 flex items-center gap-1 text-[10px] text-emerald-500">
                    <span className="font-bold">+12%</span> vs ontem
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  Equipe Ativa
                </h4>
                <div className="flex -space-x-2 overflow-hidden">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="inline-block h-8 w-8 rounded-full ring-2 ring-background bg-muted border border-border/50 flex items-center justify-center text-[10px] font-bold">
                      B{i}
                    </div>
                  ))}
                  <div className="flex items-center justify-center h-8 w-8 rounded-full ring-2 ring-background bg-primary/20 text-primary text-[10px] font-bold border border-primary/30">
                    +2
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground italic">6 barbeiros operando agora</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Floating indicators */}
        <motion.div 
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-6 -right-6 p-4 rounded-2xl glass border border-primary/20 bg-primary/5 hidden lg:block"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground font-medium">Notificação</p>
              <p className="text-xs font-bold">Reserva confirmada!</p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.5, duration: 1 }}
      className="relative mt-20 max-w-4xl mx-auto"
    >
      <div className="absolute inset-0 bg-primary/10 blur-[80px] -z-10 rounded-full" />
      
      <div className="relative p-1 bg-gradient-to-b from-primary/30 via-primary/5 to-transparent rounded-[2rem]">
        <div className="bg-[#0c0c0c] rounded-[1.9rem] overflow-hidden border border-white/5">
          <div className="p-8 md:p-12">
            <div className="max-w-xl">
              <span className="text-[10px] text-primary font-bold tracking-[0.3em] uppercase mb-4 block">
                The Vintage Experience
              </span>
              <h3 className="text-3xl font-display font-medium text-white mb-6 leading-tight italic">
                "Gestão que respeita a tradição e valoriza cada detalhe do seu atendimento."
              </h3>
              
              <div className="grid grid-cols-2 gap-8 mt-12">
                <div className="space-y-1">
                  <p className="text-5xl font-display font-bold text-gradient-gold">01</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Ambiente</p>
                  <p className="text-[10px] text-muted-foreground/60 leading-relaxed">Sua marca presente em cada interação digital com o cliente.</p>
                </div>
                <div className="space-y-1">
                  <p className="text-5xl font-display font-bold text-gradient-gold">02</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Ritmo</p>
                  <p className="text-[10px] text-muted-foreground/60 leading-relaxed">Fluxo de atendimento pensado para quem preza pela qualidade.</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-white/5 bg-white/[0.02] p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full border border-white/10 flex items-center justify-center text-primary italic font-display">
                Bf
              </div>
              <div>
                <p className="text-[11px] text-white font-medium">BarberFlow Editorial</p>
                <p className="text-[10px] text-muted-foreground">Volume I · MMXV</p>
              </div>
            </div>
            <div className="flex gap-2">
              <div className="h-1.5 w-12 rounded-full bg-primary/40" />
              <div className="h-1.5 w-8 rounded-full bg-white/10" />
              <div className="h-1.5 w-8 rounded-full bg-white/10" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Editorial aesthetic elements */}
      <div className="absolute -left-12 -top-12 text-6xl text-primary/10 font-display italic select-none hidden xl:block">
        Tradition
      </div>
      <div className="absolute -right-12 -bottom-6 text-6xl text-primary/10 font-display italic select-none hidden xl:block">
        Excellence
      </div>
    </motion.div>
  );
};

export default SystemPreview;
