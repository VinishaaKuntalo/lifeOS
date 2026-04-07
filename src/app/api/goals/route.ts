import { NextResponse } from "next/server";

import { getCurrentUser } from "@/features/auth/services/auth-service";
import { goalFormSchema } from "@/features/goals/schemas/goal-schemas";
import {
  createGoal,
  getGoalsWorkspace,
} from "@/features/goals/services/goal-service";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const data = await getGoalsWorkspace(user.id);
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const parsed = goalFormSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Invalid goal input.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  await createGoal(user.id, parsed.data);
  const data = await getGoalsWorkspace(user.id);

  return NextResponse.json({
    data,
    message: "Goal created.",
  });
}
