import { NextResponse } from "next/server";

import { getCurrentUser } from "@/features/auth/services/auth-service";
import { healthMetricSchema } from "@/features/health/schemas/health-schemas";
import {
  getHealthWorkspace,
  upsertHealthMetric,
} from "@/features/health/services/health-service";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const data = await getHealthWorkspace(user.id);
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const parsed = healthMetricSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Invalid health metric input.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  await upsertHealthMetric(user.id, parsed.data);
  const data = await getHealthWorkspace(user.id);

  return NextResponse.json({
    data,
    message: "Health metric saved.",
  });
}
