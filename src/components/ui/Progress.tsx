import { cn } from "@/lib/utils";

interface ProgressProps {
  value: number;
  max?: number;
  className?: string;
  barClassName?: string;
  variant?: "default" | "gold" | "teal" | "lavender";
}

export function Progress({
  value,
  max = 100,
  className,
  barClassName,
  variant = "default",
}: ProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div
      className={cn(
        "h-2 w-full overflow-hidden rounded-full bg-[#CDBED6]/20 dark:bg-[#2D3561]",
        className
      )}
    >
      <div
        className={cn(
          "h-full transition-all duration-500 ease-out rounded-full",
          variant === "default" && "bg-[#1F315B] dark:bg-[#CDBED6]",
          variant === "gold" && "bg-[#D4AF63]",
          variant === "teal" && "bg-[#2E7C83]",
          variant === "lavender" && "bg-[#5E3B6C]",
          barClassName
        )}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
