import { clsx } from "clsx";
import type { ElementType, HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  as?: ElementType;
  variant?: "default" | "panel";
  interactive?: boolean;
}

export function Card({
  as: Tag = "div",
  variant = "default",
  interactive = false,
  className,
  children,
  ...rest
}: CardProps) {
  return (
    <Tag
      {...rest}
      className={clsx(
        "rounded-lg border border-border p-6",
        variant === "panel" ? "bg-panel" : "bg-card",
        interactive &&
          "transition-[box-shadow,transform] duration-150 hover:shadow-hover hover:-translate-y-px cursor-pointer",
        className
      )}
    >
      {children}
    </Tag>
  );
}
