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
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a227] focus-visible:ring-offset-2",
        "disabled:opacity-50 disabled:pointer-events-none",
        // Variant styles
        variant === "primary" &&
          "bg-[#1a2b4a] text-[#F8F5F0] hover:bg-[#1a2b4a]/90 shadow-md",
        variant === "secondary" &&
          "bg-[#7b6b8d] text-[#F8F5F0] hover:bg-[#7b6b8d]/90",
        variant === "outline" &&
          "border-2 border-[#c9a227] text-[#1a2b4a] hover:bg-[#c9a227]/10 dark:text-[#F8F5F0]",
        variant === "ghost" &&
          "text-[#1a2b4a] hover:bg-[#1a2b4a]/10 dark:text-[#F8F5F0] dark:hover:bg-[#F8F5F0]/10",
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
