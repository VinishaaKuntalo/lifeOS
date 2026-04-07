import { NextResponse } from "next/server";

import { getCurrentUser } from "@/features/auth/services/auth-service";
import { projectFormSchema } from "@/features/tasks/schemas/task-schemas";
import {
  createProject,
  getTasksWorkspace,
} from "@/features/tasks/services/task-service";

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const parsed = projectFormSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Invalid project input.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  await createProject(user.id, parsed.data);
  const data = await getTasksWorkspace(user.id);

  return NextResponse.json({
    data,
    message: "Project created.",
  });
}
