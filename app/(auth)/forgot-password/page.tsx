import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const runtime = "edge";

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Reset your At Ease Learning account password.",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
