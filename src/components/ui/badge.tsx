import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const variants = {
  default: "border-white/10 bg-white/10 text-slate-200",
  high: "border-orange-400/30 bg-orange-500/15 text-orange-200",
  medium: "border-sky-400/30 bg-sky-500/15 text-sky-200",
  low: "border-slate-400/20 bg-slate-400/10 text-slate-300",
  done: "border-emerald-400/30 bg-emerald-500/15 text-emerald-200",
  blocked: "border-red-400/30 bg-red-500/15 text-red-200",
};

export function Badge({
  className,
  variant = "default",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { variant?: keyof typeof variants }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
