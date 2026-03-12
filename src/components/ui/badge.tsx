import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        default:  "bg-[#27272a] text-[#a1a1aa]",
        accent:   "bg-[#312e81] text-[#818cf8]",
        success:  "bg-[#22c55e]/10 text-[#22c55e]",
        warning:  "bg-[#f59e0b]/10 text-[#f59e0b]",
        danger:   "bg-[#ef4444]/10 text-[#ef4444]",
        info:     "bg-[#3b82f6]/10 text-[#3b82f6]",
        outline:  "border border-[#3f3f46] text-[#a1a1aa]",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
