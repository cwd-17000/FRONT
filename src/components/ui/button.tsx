import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-all duration-150 disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none",
  {
    variants: {
      variant: {
        primary:
          "bg-[#6366f1] text-white hover:bg-[#818cf8] shadow-[0_1px_2px_0_rgb(0,0,0,0.4)]",
        secondary:
          "bg-[#27272a] text-[#fafafa] border border-[#3f3f46] hover:bg-[#3f3f46]",
        ghost:
          "text-[#a1a1aa] hover:text-[#fafafa] hover:bg-[#27272a]",
        danger:
          "bg-[#ef4444]/10 text-[#ef4444] border border-[#ef4444]/20 hover:bg-[#ef4444]/20",
        outline:
          "border border-[#3f3f46] text-[#fafafa] hover:bg-[#27272a]",
      },
      size: {
        sm: "h-7 px-3 text-xs",
        md: "h-9 px-4",
        lg: "h-10 px-5 text-base",
        icon: "h-8 w-8 p-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
