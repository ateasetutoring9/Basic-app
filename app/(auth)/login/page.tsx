import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";

export const runtime = "edge";

export const metadata: Metadata = {
  title: "Log In",
  description: "Log in to your At Ease Learning account to track your progress.",
};

interface Props {
  searchParams: Promise<{ reset?: string }>;
}

export default async function LoginPage({ searchParams }: Props) {
  const { reset } = await searchParams;
  return <LoginForm resetSuccess={reset === "success"} />;
}
