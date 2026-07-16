import { ReactNode, ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

export function Button({
  children,
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center font-medium transition-all duration-200 rounded-full",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF63] focus-visible:ring-offset-2",
        "disabled:opacity-50 disabled:pointer-events-none",
        // Variant styles
        variant === "primary" &&
          "bg-[#1F315B] text-[#F6F1E8] hover:bg-[#1F315B]/90 shadow-md",
        variant === "secondary" &&
          "bg-[#5E3B6C] text-[#F6F1E8] hover:bg-[#5E3B6C]/90",
        variant === "outline" &&
          "border-2 border-[#D4AF63] text-[#1F315B] hover:bg-[#D4AF63]/10 dark:text-[#F6F1E8]",
        variant === "ghost" &&
          "text-[#1F315B] hover:bg-[#1F315B]/10 dark:text-[#F6F1E8] dark:hover:bg-[#F6F1E8]/10",
        // Size styles
        size === "sm" && "px-4 py-1.5 text-sm",
        size === "md" && "px-6 py-2.5 text-sm",
        size === "lg" && "px-8 py-3 text-base",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
