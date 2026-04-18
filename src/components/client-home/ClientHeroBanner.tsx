import { motion } from "framer-motion";
import { MapPin, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { cityPlaceholder, getClientHomeCopy } from "@/lib/clientHomeCopy";
import { cn } from "@/lib/utils";

interface ClientHeroBannerProps {
  firstName: string;
}

const ClientHeroBanner = ({ firstName }: ClientHeroBannerProps) => {
  const { identity } = useTheme();
  const isVintage = identity === "vintage";
  const copy = getClientHomeCopy(identity);
  const city = cityPlaceholder;
  const freeSlotsToday = 8;

  if (isVintage) {
    return (
      <div className="relative min-h-[280px] overflow-hidden rounded-2xl border border-primary/12 shadow-md lg:min-h-[320px]">
        <img
          src="https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=1400&q=80"
          alt="Barbearia premium"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-1000"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent sm:bg-gradient-to-r sm:from-black sm:via-black/60 sm:to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_20%_40%,hsl(var(--primary)/0.14),transparent_70%)]" />

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative z-10 flex h-full max-w-2xl flex-col justify-center p-8 lg:p-12"
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <h1 className="font-vintage-heading text-3xl font-bold leading-[1.1] tracking-tight text-white lg:text-5xl">
                {copy.hero.titleLead(firstName)}
                <span className="text-gradient-gold">{copy.hero.titleAccent}</span>
              </h1>
              <p className="max-w-md text-sm font-medium leading-relaxed text-white/60 lg:text-base">{copy.hero.subtitle(city)}</p>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-primary/90 backdrop-blur-sm">
                <MapPin className="h-3.5 w-3.5" />
                {copy.hero.pill(city, freeSlotsToday)}
              </div>
            </div>

            <div className="relative pt-4">
              <Link to="/cliente/buscar" className="group/cta relative inline-block">
                <div className="absolute inset-0 rounded-xl border border-primary/35 opacity-60 animate-[ring_2s_infinite] group-hover/cta:animate-none group-hover/cta:opacity-0" />
                <Button
                  className={cn(
                    "relative z-10 h-12 rounded-xl px-7 text-xs font-semibold uppercase tracking-[0.12em] shadow-none transition-all duration-300",
                    "bg-primary text-primary-foreground hover:translate-y-[-2px]",
                    "before:absolute before:inset-[-4px] before:rounded-2xl before:border-2 before:border-primary/25 before:opacity-0 before:transition-all before:duration-300 hover:before:opacity-100",
                  )}
                >
                  <Search className="mr-2 h-4 w-4" />
                  {copy.hero.cta}
                </Button>
              </Link>
            </div>
          </div>
          <style
            dangerouslySetInnerHTML={{
              __html: `
            @keyframes ring {
              0% { transform: scale(1); opacity: 0.8; }
              100% { transform: scale(1.6); opacity: 0; }
            }
          `,
            }}
          />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[220px] overflow-hidden rounded-2xl border border-primary/15 bg-card/60 shadow-xl md:min-h-[240px]">
      <div className="grid min-h-[220px] md:grid-cols-5">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="relative z-10 flex flex-col justify-center p-6 md:col-span-3 md:p-8 lg:p-10"
        >
          <h1 className="text-2xl font-bold leading-tight tracking-tight text-foreground md:text-3xl">{copy.hero.titleAccent}</h1>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">{copy.hero.subtitle(city)}</p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-primary/15 bg-primary/5 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-primary">
              <MapPin className="h-3 w-3" />
              {copy.hero.pill(city, freeSlotsToday)}
            </span>
          </div>
          <div className="mt-5">
            <Link to="/cliente/buscar">
              <Button className="h-11 rounded-xl px-6 text-[10px] font-black uppercase tracking-[0.2em]">
                <Search className="mr-2 h-3.5 w-3.5" />
                {copy.hero.cta}
              </Button>
            </Link>
          </div>
        </motion.div>
        <div className="relative min-h-[120px] md:col-span-2 md:min-h-0">
          <img
            src="https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=900&q=80"
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-75"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent md:bg-gradient-to-l md:from-transparent md:via-background/30 md:to-background/95" />
        </div>
      </div>
    </div>
  );
};

export default ClientHeroBanner;
