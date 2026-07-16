import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "error" | "info" | "gold";
  size?: "sm" | "md";
  className?: string;
}

export function Badge({
  children,
  variant = "default",
  size = "sm",
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center font-medium rounded-full transition-colors",
        // Size styles
        size === "sm" && "px-2.5 py-0.5 text-xs",
        size === "md" && "px-3 py-1 text-sm",
        // Variant styles
        variant === "default" &&
          "bg-[#CDBED6]/30 text-[#5E3B6C] dark:bg-[#5E3B6C]/30 dark:text-[#CDBED6]",
        variant === "success" &&
          "bg-[#2E7C83]/20 text-[#2E7C83] dark:bg-[#2E7C83]/30 dark:text-[#2E7C83]",
        variant === "warning" &&
          "bg-[#D4AF63]/20 text-[#B8954F] dark:bg-[#D4AF63]/30 dark:text-[#D4AF63]",
        variant === "error" &&
          "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
        variant === "info" &&
          "bg-[#1F315B]/10 text-[#1F315B] dark:bg-[#1F315B]/30 dark:text-[#CDBED6]",
        variant === "gold" &&
          "bg-[#D4AF63]/20 text-[#8B7355] dark:bg-[#D4AF63]/20 dark:text-[#D4AF63]",
        className
      )}
    >
      {children}
    </span>
  );
}
