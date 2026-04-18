import React from "react";
import { cn } from "@/lib/utils";

interface PasswordStrengthMeterProps {
  password?: string;
}

const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({ password = "" }) => {
  const getStrength = (pwd: string) => {
    let i = 0;
    if (!pwd) return 0;
    if (pwd.length > 6) i++;
    if (pwd.length >= 10) i++;
    if (/[A-Z]/.test(pwd)) i++;
    if (/[0-9]/.test(pwd)) i++;
    if (/[^A-Za-z0-9]/.test(pwd)) i++; // Special characters
    return i;
  };

  const strength = getStrength(password);

  const getLabel = () => {
    if (!password) return "";
    if (strength <= 2) return "Fraca";
    if (strength <= 4) return "Moderada";
    return "Forte";
  };

  const getColor = () => {
    if (!password) return "transparent";
    if (strength <= 2) return "#ff0000"; // Red
    if (strength <= 4) return "#eedc3d"; // Yellowish
    return "#18e605"; // Green
  };

  const getWidth = () => {
    if (!password) return "0%";
    if (strength <= 2) return "33%";
    if (strength <= 4) return "66%";
    return "100%";
  };

  const color = getColor();
  const width = getWidth();
  const label = getLabel();

  return (
    <div className="w-full mt-2">
      <div 
        className="password-strength-meter"
        style={{ 
          "--strength-width": width, 
          "--strength-color": color 
        } as React.CSSProperties}
      >
        <div className="strength-bar" />
      </div>
      {label && (
        <p className="password-strength-text" style={{ "--strength-color": color } as React.CSSProperties}>
          Senha {label}
        </p>
      )}
    </div>
  );
};

export default PasswordStrengthMeter;
