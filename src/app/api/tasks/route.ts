import { NextResponse } from "next/server";

import { getCurrentUser } from "@/features/auth/services/auth-service";
import { taskFormSchema } from "@/features/tasks/schemas/task-schemas";
import {
  createTask,
  getTasksWorkspace,
} from "@/features/tasks/services/task-service";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const data = await getTasksWorkspace(user.id);
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const parsed = taskFormSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Invalid task input.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  await createTask(user.id, parsed.data);
  const data = await getTasksWorkspace(user.id);

  return NextResponse.json({
    data,
    message: "Task created.",
  });
}
