import { clsx } from "clsx";
import type { ElementType, HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  as?: ElementType;
}

export function Card({ as: Tag = "div", className, children, ...rest }: CardProps) {
  return (
    <Tag
      {...rest}
      className={clsx(
        "rounded-lg border border-border bg-white p-6 shadow-sm",
        className
      )}
    >
      {children}
    </Tag>
  );
}
