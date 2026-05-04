import type { Metadata } from "next";
import { Header } from "./_components/Header";
import { FoundingBanner } from "./_components/FoundingBanner";
import { Hero } from "./_components/Hero";
import { WhatsFree } from "./_components/WhatsFree";
import { HowItWorks } from "./_components/HowItWorks";
import { CurriculumCoverage } from "./_components/CurriculumCoverage";
import { SampleQuestion } from "./_components/SampleQuestion";
import { MeetTutors } from "./_components/MeetTutors";
import { Pricing } from "./_components/Pricing";
import { Testimonials } from "./_components/Testimonials";
import { TrustStrip } from "./_components/TrustStrip";
import { FounderNote } from "./_components/FounderNote";
import { FAQ } from "./_components/FAQ";
import { FinalCTA } from "./_components/FinalCTA";
import { Footer } from "./_components/Footer";

export const metadata: Metadata = {
  title: "At Ease Learning — Free Education for Year 7–12",
  description:
    "Free, high-quality education for Year 7–12 Australian students — lectures, worksheets, and instant feedback, all in one place.",
};

export default function Home() {
  return (
    <main>
      <Header />
      <FoundingBanner />
      <Hero />
      <WhatsFree />
      <HowItWorks />
      <CurriculumCoverage />
      <SampleQuestion />
      <MeetTutors />
      <Pricing />
      <Testimonials />
      <TrustStrip />
      <FounderNote />
      <FAQ />
      <FinalCTA />
      <Footer />
    </main>
  );
}
