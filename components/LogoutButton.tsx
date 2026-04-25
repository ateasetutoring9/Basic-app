"use client";

import { useRouter } from "next/navigation";
import { logout } from "@/lib/auth/session";
import { Button } from "@/components/ui/Button";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push("/");
    router.refresh();
  }

  return (
    <Button variant="secondary" size="md" onClick={handleLogout}>
      Log Out
    </Button>
  );
}
