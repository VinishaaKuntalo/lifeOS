import { NextResponse } from "next/server";

import { getCurrentUser } from "@/features/auth/services/auth-service";
import { deleteAccount } from "@/features/settings/services/settings-service";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  await deleteAccount(user.id);
  return NextResponse.json({ message: "Account scheduled for deletion." });
}
