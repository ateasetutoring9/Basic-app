import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Log In",
  description: "Log in to your At Ease Learning account to track your progress.",
};

export default function LoginPage() {
  return <LoginForm />;
}
