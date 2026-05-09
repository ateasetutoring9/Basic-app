import type { ReactNode } from "react";

export const runtime = "edge";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
