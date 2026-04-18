import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

export const WIZARD_EASE = [0.22, 1, 0.36, 1] as const;

/** Bloco do wizard com entrada ao rolar (respeita preferência de movimento reduzido). */
export function WizardSection({ className, children }: { className?: string; children: ReactNode }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.section
      className={className}
      initial={reduceMotion ? false : { opacity: 0, y: 14 }}
      whileInView={reduceMotion ? false : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12, margin: "0px 0px -32px 0px" }}
      transition={{ duration: 0.4, ease: WIZARD_EASE }}
    >
      {children}
    </motion.section>
  );
}
