import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

/** Objeto separado para o TS inferir chaves de `variant` / `size` (evita `VariantProps` vazio com compoundVariants). */
const buttonStyleMap = {
  variant: {
    default: "theme-button bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-150",
    gold:
      "bg-primary text-primary-foreground font-semibold shadow-none hover:opacity-95 active:opacity-90 transition-colors duration-150 shrink-0",
    goldHero:
      "group font-semibold text-primary-foreground bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--primary-deep))] shadow-[0_12px_32px_hsl(var(--primary)/0.35)] hover:shadow-[0_16px_40px_hsl(var(--primary)/0.45)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-150 [&_svg]:transition-transform [&_svg]:duration-150 [&_svg]:group-hover:scale-105",
    "gold-outline": "border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-150",
    destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
    outline:
      "theme-button border border-border/60 bg-background/50 text-muted-foreground hover:border-border hover:bg-accent/50 hover:text-foreground transition-all duration-150",
    outlineGold:
      "border-2 border-primary/60 text-primary hover:border-primary hover:bg-primary/10 hover:text-primary hover:shadow-[0_4px_12px_hsl(var(--primary)/0.2)] transition-all duration-150",
    secondary: "theme-button bg-secondary text-secondary-foreground hover:bg-secondary/80",
    ghost: "theme-button hover:bg-accent hover:text-accent-foreground",
    link: "theme-button text-primary underline-offset-4 hover:underline",
  },
  size: {
    default: "h-10 px-4 py-2",
    xs: "h-8 rounded-md px-2 text-xs",
    sm: "h-9 rounded-md px-3",
    lg: "h-12 rounded-lg px-8 text-base",
    xl: "h-14 rounded-lg px-10 text-lg",
    icon: "h-10 w-10",
  },
} as const;

export type ButtonVariant = keyof typeof buttonStyleMap.variant;
export type ButtonSize = keyof typeof buttonStyleMap.size;

const buttonVariants = cva(
  "theme-button inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--theme-radius-sm)] text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: buttonStyleMap,
    compoundVariants: [
      {
        variant: "goldHero",
        size: "sm",
        class: "px-5 h-10 font-semibold",
      },
    ],
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

/** `size` do DOM é `number` (HTMLAttributes); omitimos para não colidir com os tamanhos do CVA (`sm`, `lg`, …). */
export interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "size"> {
  asChild?: boolean;
  variant?: ButtonVariant | null;
  size?: ButtonSize | null;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size }), className)} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
