import { useMemo, type ComponentProps } from "react";
import { Toaster as Sonner, toast } from "sonner";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

type ToasterProps = ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { identity } = useTheme();

  const toastOptions = useMemo(() => {
    const baseToast =
      "group toast group-[.toaster]:text-foreground group-[.toaster]:shadow-lg";

    if (identity === "vintage") {
      return {
        classNames: {
          toast: cn(
            baseToast,
            "group-[.toaster]:border-2 group-[.toaster]:border-primary/35",
            "group-[.toaster]:bg-card/95 group-[.toaster]:backdrop-blur-md",
            "group-[.toaster]:shadow-[0_12px_40px_hsl(var(--primary)/0.14)]",
          ),
          title:
            "group-[.toast]:font-display group-[.toast]:text-[0.9375rem] group-[.toast]:font-semibold group-[.toast]:leading-snug",
          description: "group-[.toast]:text-muted-foreground group-[.toast]:text-sm group-[.toast]:leading-relaxed",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:font-medium",
          cancelButton: "group-[.toast]:bg-muted/70 group-[.toast]:text-muted-foreground",
          closeButton:
            "group-[.toast]:border-border/50 group-[.toast]:bg-background/60 group-[.toast]:text-foreground",
          success:
            "group-[.toast]:border-primary/40 group-[.toast]:bg-primary/[0.08] group-[.toast]:text-foreground",
          error:
            "group-[.toast]:border-destructive/45 group-[.toast]:bg-destructive/[0.08] group-[.toast]:text-foreground",
        },
      };
    }

    return {
      classNames: {
        toast: cn(
          baseToast,
          "group-[.toaster]:border group-[.toaster]:border-border/75",
          "group-[.toaster]:bg-background/95 group-[.toaster]:backdrop-blur-sm",
        ),
        title: "group-[.toast]:text-sm group-[.toast]:font-semibold group-[.toast]:tracking-tight",
        description: "group-[.toast]:text-muted-foreground group-[.toast]:text-sm",
        actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
        cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        closeButton: "group-[.toast]:border-border group-[.toast]:bg-muted/40",
        success:
          "group-[.toast]:border-emerald-500/35 group-[.toast]:bg-emerald-500/[0.07] group-[.toast]:text-foreground",
        error:
          "group-[.toast]:border-destructive/40 group-[.toast]:bg-destructive/[0.07] group-[.toast]:text-foreground",
      },
    };
  }, [identity]);

  return (
    <Sonner
      theme="dark"
      className={cn(
        "toaster group",
        identity === "vintage" && "sonner-identity-vintage",
        identity === "modern" && "sonner-identity-modern",
      )}
      toastOptions={toastOptions}
      {...props}
    />
  );
};

export { Toaster, toast };
