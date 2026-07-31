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
          "bg-[#e8e4f0]/30 text-[#7b6b8d] dark:bg-[#7b6b8d]/30 dark:text-[#e8e4f0]",
        variant === "success" &&
          "bg-[#4a9b9b]/20 text-[#4a9b9b] dark:bg-[#4a9b9b]/30 dark:text-[#4a9b9b]",
        variant === "warning" &&
          "bg-[#c9a227]/20 text-[#B8954F] dark:bg-[#c9a227]/30 dark:text-[#c9a227]",
        variant === "error" &&
          "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
        variant === "info" &&
          "bg-[#1a2b4a]/10 text-[#1a2b4a] dark:bg-[#1a2b4a]/30 dark:text-[#e8e4f0]",
        variant === "gold" &&
          "bg-[#c9a227]/20 text-[#8B7355] dark:bg-[#c9a227]/20 dark:text-[#c9a227]",
        className
      )}
    >
      {children}
    </span>
  );
}
