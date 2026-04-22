import type { Metadata } from "next";
import "./globals.css";
import TopNav from "@/components/TopNav";

export const metadata: Metadata = {
  title: {
    template: "%s — LearnFree",
    default: "LearnFree — Free Education for Year 7–12",
  },
  description:
    "Free, high-quality education for Year 7–12 students — lectures, worksheets, and instant feedback.",
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
