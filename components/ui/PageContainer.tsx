import { clsx } from "clsx";
import type { ElementType, HTMLAttributes } from "react";

interface PageContainerProps extends HTMLAttributes<HTMLDivElement> {
  as?: ElementType;
}

export function PageContainer({
  as: Tag = "div",
  className,
  children,
  ...rest
}: PageContainerProps) {
  return (
    <Tag
      {...rest}
      className={clsx("max-w-3xl mx-auto px-4 py-8", className)}
    >
      {children}
    </Tag>
  );
}
