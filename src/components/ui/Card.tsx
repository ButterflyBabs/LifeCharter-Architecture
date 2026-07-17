import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: "default" | "glass" | "bordered";
  style?: React.CSSProperties;
}

export function Card({ children, className, variant = "default", style }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-[16px] overflow-hidden transition-all duration-200",
        variant === "default" && "bg-card text-card-foreground shadow-[0_4px_20px_rgba(31,49,91,0.08)]",
        variant === "glass" && "bg-card/80 backdrop-blur-sm text-card-foreground",
        variant === "bordered" && "bg-card text-card-foreground border border-[#D4AF63]/30 shadow-[0_4px_20px_rgba(31,49,91,0.08)]",
        className
      )}
      style={style}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}

export function CardHeader({ children, className }: CardHeaderProps) {
  return (
    <div className={cn("px-6 py-4 border-b border-border/50", className)}>
      {children}
    </div>
  );
}

interface CardTitleProps {
  children: ReactNode;
  className?: string;
}

export function CardTitle({ children, className }: CardTitleProps) {
  return (
    <h3
      className={cn(
        "font-serif text-sm font-semibold tracking-wider uppercase text-foreground",
        className
      )}
    >
      {children}
    </h3>
  );
}

interface CardContentProps {
  children: ReactNode;
  className?: string;
}

export function CardContent({ children, className }: CardContentProps) {
  return <div className={cn("p-6", className)}>{children}</div>;
}

interface CardFooterProps {
  children: ReactNode;
  className?: string;
}

export function CardFooter({ children, className }: CardFooterProps) {
  return (
    <div className={cn("px-6 py-4 border-t border-border/50", className)}>
      {children}
    </div>
  );
}
