import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export const runtime = "edge";

export const metadata: Metadata = {
  title: "Set New Password",
  description: "Set a new password for your At Ease Learning account.",
};

interface Props {
  searchParams: Promise<{ token?: string }>;
}

export default async function ResetPasswordPage({ searchParams }: Props) {
  const { token } = await searchParams;

  if (!token) notFound();

  return <ResetPasswordForm token={token} />;
}
