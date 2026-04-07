import { NextResponse } from "next/server";

import { getCurrentUser } from "@/features/auth/services/auth-service";
import { exportUserData } from "@/features/settings/services/settings-service";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  return NextResponse.json(await exportUserData(user.id));
}
