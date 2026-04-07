import { NextResponse } from "next/server";

import { getCurrentUser } from "@/features/auth/services/auth-service";
import { milestoneFormSchema } from "@/features/goals/schemas/goal-schemas";
import {
  createMilestone,
  getGoalsWorkspace,
} from "@/features/goals/services/goal-service";

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const parsed = milestoneFormSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Invalid milestone input.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  await createMilestone(user.id, parsed.data);
  const data = await getGoalsWorkspace(user.id);

  return NextResponse.json({
    data,
    message: "Milestone created.",
  });
}
