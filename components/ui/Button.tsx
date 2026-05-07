import Link from "next/link";
import { clsx } from "clsx";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  href?: string;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-accent text-[var(--accent-text-on)] hover:bg-accent-hover active:bg-accent-hover " +
    "border border-transparent " +
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
  secondary:
    "bg-transparent text-fg border border-border-strong hover:bg-panel active:bg-panel " +
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
  ghost:
    "bg-transparent text-accent border border-transparent hover:underline " +
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-4 py-2    text-sm  min-h-[32px]",
  md: "px-5 py-2.5  text-sm  min-h-[40px]",
  lg: "px-7 py-3.5  text-base min-h-[52px]",
};

export function Button({
  variant = "primary",
  size = "md",
  href,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  const classes = clsx(
    "inline-flex items-center justify-center rounded-md font-medium",
    "transition-colors duration-150 cursor-pointer select-none",
    "disabled:opacity-50 disabled:pointer-events-none",
    variantClasses[variant],
    sizeClasses[size],
    className
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button {...rest} disabled={disabled} className={classes}>
      {children}
    </button>
  );
}
