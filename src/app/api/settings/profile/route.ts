import { NextResponse } from "next/server";

import { getCurrentUser } from "@/features/auth/services/auth-service";
import { profileSettingsSchema } from "@/features/settings/schemas/settings-schemas";
import {
  getSettingsWorkspace,
  updateProfileSettings,
} from "@/features/settings/services/settings-service";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  return NextResponse.json(await getSettingsWorkspace(user.id));
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const parsed = profileSettingsSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Invalid settings input." },
      { status: 400 },
    );
  }

  await updateProfileSettings(user.id, parsed.data);
  return NextResponse.json({
    data: await getSettingsWorkspace(user.id),
    message: "Profile updated.",
  });
}
