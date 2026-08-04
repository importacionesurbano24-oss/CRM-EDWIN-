"use client";

import { useTransition } from "react";
import { LogOut } from "lucide-react";
import { actionLogout } from "@/app/actions/auth.actions";

export function LogoutButton() {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => actionLogout())}
      title="Cerrar sesión"
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[#444] transition-colors hover:bg-[#1A1A1A] hover:text-foreground disabled:opacity-50"
    >
      <LogOut className="size-4" />
    </button>
  );
}
