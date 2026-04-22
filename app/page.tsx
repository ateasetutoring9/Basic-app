import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { HomeAuth } from "@/components/HomeAuth";
import logo from "@/images/logo/Logo-Atease-Website.PNG";

export const metadata: Metadata = {
  title: "At Ease Learning — Free Education for Year 7–12",
  description:
    "Free, high-quality education for Year 7–12 students — lectures, worksheets, and instant feedback, all in one place.",
};

export default function Home() {
  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center px-6 py-16">
      <div className="max-w-xl w-full text-center space-y-8">
        <div className="flex flex-col items-center gap-4">
          <Image src={logo} alt="At Ease Learning" width={100} height={100} className="rounded-full" />
          <h1 className="text-5xl font-bold tracking-tight text-fg">
            At Ease Learning
          </h1>
        </div>

        <p className="text-xl text-muted leading-relaxed">
          Free, high-quality education for Year 7–12 students — lectures,
          worksheets, and instant feedback, all in one place.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
          <Link
            href="/browse"
            className="inline-flex items-center justify-center min-h-[44px] px-8 py-3 rounded-xl bg-primary text-white text-lg font-semibold hover:bg-primary-hover transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Browse Lectures
          </Link>

          <HomeAuth />
        </div>
      </div>
    </main>
  );
}
