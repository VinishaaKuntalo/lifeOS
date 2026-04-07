import { NextResponse } from "next/server";

import { getCurrentUser } from "@/features/auth/services/auth-service";
import { habitFormSchema } from "@/features/habits/schemas/habit-schemas";
import {
  archiveHabit,
  getHabitsDashboard,
  updateHabit,
} from "@/features/habits/services/habit-service";

export async function PATCH(
  request: Request,
  { params }: { params: { habitId: string } },
) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const parsed = habitFormSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Invalid habit input.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  await updateHabit(user.id, params.habitId, parsed.data);
  const data = await getHabitsDashboard(user.id);

  return NextResponse.json({
    data,
    message: "Habit updated.",
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: { habitId: string } },
) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  await archiveHabit(user.id, params.habitId);
  const data = await getHabitsDashboard(user.id);

  return NextResponse.json({
    data,
    message: "Habit archived.",
  });
}
