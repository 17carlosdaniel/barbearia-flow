import { useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export const useMouseParallax = (intensity: number = 0.02) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      x.set((e.clientX / window.innerWidth - 0.5) * intensity);
      y.set((e.clientY / window.innerHeight - 0.5) * intensity);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [intensity, x, y]);

  return { x, y };
};

interface ParallaxContainerProps {
  children: React.ReactNode;
  intensity?: number;
  className?: string;
}

export const ParallaxContainer = ({ children, intensity = 20, className }: ParallaxContainerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springX = useSpring(x, { stiffness: 100, damping: 30 });
  const springY = useSpring(y, { stiffness: 100, damping: 30 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const valX = ((e.clientX - rect.left) / rect.width - 0.5) * intensity;
      const valY = ((e.clientY - rect.top) / rect.height - 0.5) * intensity;
      x.set(valX);
      y.set(valY);
    };
    
    // Throttle via requestAnimationFrame isn't strictly necessary since Framer Motion values
    // are highly optimized, but setting them directly avoids React render loops.
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [intensity, x, y]);

  return (
    <motion.div
      ref={containerRef}
      className={className}
      style={{ x: springX, y: springY }}
    >
      {children}
    </motion.div>
  );
};
