import { NextResponse } from "next/server";

import { getCurrentUser } from "@/features/auth/services/auth-service";
import {
  taskFormSchema,
  taskMoveSchema,
} from "@/features/tasks/schemas/task-schemas";
import {
  archiveTask,
  getTasksWorkspace,
  moveTask,
  updateTask,
} from "@/features/tasks/services/task-service";

export async function PATCH(
  request: Request,
  { params }: { params: { taskId: string } },
) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json();
  const parsedMove = taskMoveSchema.safeParse(body);

  if (parsedMove.success) {
    await moveTask(user.id, params.taskId, parsedMove.data);
    const data = await getTasksWorkspace(user.id);

    return NextResponse.json({
      data,
      message: "Task moved.",
    });
  }

  const parsedTask = taskFormSchema.safeParse(body);

  if (!parsedTask.success) {
    return NextResponse.json(
      {
        message: "Invalid task input.",
        fieldErrors: parsedTask.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  await updateTask(user.id, params.taskId, parsedTask.data);
  const data = await getTasksWorkspace(user.id);

  return NextResponse.json({
    data,
    message: "Task updated.",
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: { taskId: string } },
) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  await archiveTask(user.id, params.taskId);
  const data = await getTasksWorkspace(user.id);

  return NextResponse.json({
    data,
    message: "Task archived.",
  });
}
