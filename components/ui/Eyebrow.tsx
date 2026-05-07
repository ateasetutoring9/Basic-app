import { clsx } from "clsx";
import type { HTMLAttributes } from "react";

type EyebrowProps = HTMLAttributes<HTMLParagraphElement>;

export function Eyebrow({ className, children, ...rest }: EyebrowProps) {
  return (
    <p {...rest} className={clsx("text-eyebrow", className)}>
      {children}
    </p>
  );
}
