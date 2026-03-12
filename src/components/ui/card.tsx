import { cn } from "@/lib/utils";

export function Card({
  className,
  hover = false,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { hover?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-[#27272a] bg-[#18181b] shadow-[0_1px_3px_0_rgb(0,0,0,0.4)]",
        hover &&
          "transition-all duration-150 hover:border-[#3f3f46] hover:shadow-[0_4px_12px_0_rgb(0,0,0,0.5)] hover:-translate-y-0.5",
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex items-center justify-between px-5 py-4 border-b border-[#27272a]", className)}
      {...props}
    />
  );
}

export function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("text-sm font-semibold text-[#fafafa]", className)}
      {...props}
    />
  );
}

export function CardContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("p-5", className)} {...props} />
  );
}

export function CardFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex items-center px-5 py-3 border-t border-[#27272a]", className)}
      {...props}
    />
  );
}
