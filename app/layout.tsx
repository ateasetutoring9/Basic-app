import type { Metadata } from "next";
import "./globals.css";
import TopNav from "@/components/TopNav";

export const metadata: Metadata = {
  title: "LearnFree",
  description: "Free education for Year 7–12 students",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <TopNav />
        {children}
      </body>
    </html>
  );
}
