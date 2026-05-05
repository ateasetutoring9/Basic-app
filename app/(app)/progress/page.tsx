import type { Metadata } from "next";
import { ProgressClient } from "@/components/ProgressClient";

export const runtime = 'edge';

export const metadata: Metadata = {
  title: "My Progress",
  description: "Track your worksheet scores, streaks, and learning history on At Ease Learning.",
};

export default function ProgressPage() {
  return <ProgressClient />;
}
