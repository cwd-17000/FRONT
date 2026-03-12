import { cn } from "@/lib/utils";

interface ProgressProps {
  value: number;        // 0–100
  color?: string;       // tailwind bg class or hex
  size?: "xs" | "sm" | "md";
  className?: string;
}

const sizeMap = { xs: "h-1", sm: "h-1.5", md: "h-2" };

export function Progress({ value, color, size = "sm", className }: ProgressProps) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div
      className={cn(
        "w-full rounded-full overflow-hidden bg-[#27272a]",
        sizeMap[size],
        className
      )}
    >
      <div
        className={cn("h-full rounded-full transition-all duration-300", !color && "bg-[#6366f1]")}
        style={{ width: `${pct}%`, ...(color ? { background: color } : {}) }}
      />
    </div>
  );
}
