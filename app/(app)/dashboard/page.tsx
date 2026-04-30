import type { Metadata } from "next";
import { PageContainer } from "@/components/ui/PageContainer";

export const metadata: Metadata = {
  title: "Home",
};

export default function DashboardPage() {
  return (
    <PageContainer as="main">
      <h1 className="text-3xl font-bold text-fg">Home</h1>
    </PageContainer>
  );
}
