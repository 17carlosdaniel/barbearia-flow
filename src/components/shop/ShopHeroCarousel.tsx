import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { getClientCommerceCopy } from "@/lib/clientCommerceCopy";
import { cn } from "@/lib/utils";

const ShopHeroCarousel = () => {
  const navigate = useNavigate();
  const { identity } = useTheme();
  const isModern = identity === "modern";
  const { hero } = useMemo(() => getClientCommerceCopy(identity), [identity]);
  const banners = isModern ? hero.modern : hero.vintage;
  const [index, setIndex] = useState(0);
  const current = banners[index % banners.length];

  useEffect(() => {
    const t = setInterval(() => {
      setIndex((prev) => (prev + 1) % banners.length);
    }, isModern ? 7000 : 5500);
    return () => clearInterval(t);
  }, [banners.length, isModern]);

  const handleCta = () => {
    const label = current.cta.toLowerCase();
    if (label.includes("diagnóstico") || label.includes("perfil capilar")) {
      navigate("/cliente/quiz");
      return;
    }
    if (label.includes("oferta")) {
      document.getElementById("store-highlights")?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    document.getElementById("store-vitrine")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border/60 shadow-card",
        isModern ? "max-h-[200px] sm:max-h-[220px]" : "",
      )}
    >
      <div
        className={cn(
          "w-full bg-cover bg-center transition-all duration-700",
          isModern ? "h-36 sm:h-44" : "h-52 sm:h-64",
        )}
        style={{ backgroundImage: `url(${current.image})` }}
      />
      <div
        className={cn(
          "absolute inset-0",
          isModern
            ? "bg-gradient-to-r from-background/92 via-background/55 to-background/25"
            : "bg-gradient-to-r from-background/88 via-background/40 to-transparent",
        )}
      />
      <div
        className={cn(
          "absolute left-4 top-1/2 max-w-lg -translate-y-1/2 sm:left-6",
          isModern ? "max-w-md" : "max-w-lg",
        )}
      >
        <h2
          className={cn(
            "font-bold text-foreground",
            isModern ? "font-manrope text-xl sm:text-2xl tracking-tight" : "font-display text-2xl sm:text-3xl",
          )}
        >
          {current.title}
        </h2>
        <p className={cn("mt-1 text-foreground/90", isModern ? "text-xs sm:text-sm" : "text-sm")}>
          {current.subtitle}
        </p>
        <Button
          className={cn("mt-3", isModern ? "h-9 text-xs sm:text-sm" : "mt-4")}
          variant={isModern ? "default" : "gold"}
          onClick={handleCta}
        >
          {current.cta}
        </Button>
      </div>
      <div className="absolute bottom-3 right-3 flex gap-1.5">
        {banners.map((b, i) => (
          <button
            key={b.id}
            type="button"
            onClick={() => setIndex(i)}
            className={cn(
              "h-2 rounded-full transition-all",
              i === index ? "w-6 bg-primary" : "w-2 bg-background/50",
            )}
            aria-label={`Banner ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default ShopHeroCarousel;
