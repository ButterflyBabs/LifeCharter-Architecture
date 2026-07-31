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
        "h-2 w-full overflow-hidden rounded-full bg-[#e8e4f0]/20 dark:bg-[#2D3561]",
        className
      )}
    >
      <div
        className={cn(
          "h-full transition-all duration-500 ease-out rounded-full",
          variant === "default" && "bg-[#1a2b4a] dark:bg-[#e8e4f0]",
          variant === "gold" && "bg-[#c9a227]",
          variant === "teal" && "bg-[#4a9b9b]",
          variant === "lavender" && "bg-[#7b6b8d]",
          barClassName
        )}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
