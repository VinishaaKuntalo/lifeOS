import { NextResponse } from "next/server";

import { getCurrentUser } from "@/features/auth/services/auth-service";
import { habitLogSchema } from "@/features/habits/schemas/habit-schemas";
import {
  getHabitsDashboard,
  upsertHabitLog,
} from "@/features/habits/services/habit-service";

export async function POST(
  request: Request,
  { params }: { params: { habitId: string } },
) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const parsed = habitLogSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Invalid habit log input.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  await upsertHabitLog(user.id, params.habitId, parsed.data);
  const data = await getHabitsDashboard(user.id);

  return NextResponse.json({
    data,
    message: "Habit log updated.",
  });
}
