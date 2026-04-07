import { NextResponse } from "next/server";

import { getCurrentUser } from "@/features/auth/services/auth-service";
import { getFinanceWorkspace } from "@/features/finance/services/finance-service";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const data = await getFinanceWorkspace(user.id);
  return NextResponse.json(data);
}
