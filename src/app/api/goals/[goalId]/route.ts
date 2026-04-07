import { NextResponse } from "next/server";

import { getCurrentUser } from "@/features/auth/services/auth-service";
import { goalFormSchema } from "@/features/goals/schemas/goal-schemas";
import {
  archiveGoal,
  getGoalsWorkspace,
  updateGoal,
} from "@/features/goals/services/goal-service";

export async function PATCH(
  request: Request,
  { params }: { params: { goalId: string } },
) {
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

  await updateGoal(user.id, params.goalId, parsed.data);
  const data = await getGoalsWorkspace(user.id);

  return NextResponse.json({
    data,
    message: "Goal updated.",
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: { goalId: string } },
) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  await archiveGoal(user.id, params.goalId);
  const data = await getGoalsWorkspace(user.id);

  return NextResponse.json({
    data,
    message: "Goal archived.",
  });
}
