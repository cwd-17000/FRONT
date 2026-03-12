import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ className, label, error, id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-[#a1a1aa]"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          "h-9 w-full rounded-lg border border-[#3f3f46] bg-[#27272a] px-3 py-2 text-sm text-[#fafafa] placeholder:text-[#71717a]",
          "transition-colors duration-150",
          "focus:outline-none focus:ring-2 focus:ring-[#6366f1]/50 focus:border-[#6366f1]",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          error && "border-[#ef4444] focus:ring-[#ef4444]/30",
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-[#ef4444]">{error}</p>}
    </div>
  );
}
