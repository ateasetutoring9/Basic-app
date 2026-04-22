import type { Metadata } from "next";
import { SignupForm } from "@/components/auth/SignupForm";

export const metadata: Metadata = {
  title: "Sign Up",
  description: "Create a free LearnFree account to save your progress.",
};

export default function SignupPage() {
  return <SignupForm />;
}
