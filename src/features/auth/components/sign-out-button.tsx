"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import { APP_ROUTES } from "@/lib/constants/routes";

import { signOutAction } from "@/features/auth/actions/auth-actions";

export function SignOutButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      onClick={() =>
        startTransition(async () => {
          await signOutAction();
          router.push(APP_ROUTES.home);
          router.refresh();
        })
      }
      disabled={isPending}
    >
      {isPending ? "Signing out..." : "Sign out"}
    </Button>
  );
}
