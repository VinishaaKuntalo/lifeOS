import { NextResponse } from "next/server";

import { getCurrentUser } from "@/features/auth/services/auth-service";
import { habitFormSchema } from "@/features/habits/schemas/habit-schemas";
import {
  createHabit,
  getHabitsDashboard,
} from "@/features/habits/services/habit-service";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const data = await getHabitsDashboard(user.id);
  return NextResponse.json(data);
}

export async function POST(request: Request) {
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

  await createHabit(user.id, parsed.data);
  const data = await getHabitsDashboard(user.id);

  return NextResponse.json({
    data,
    message: "Habit created.",
  });
}
