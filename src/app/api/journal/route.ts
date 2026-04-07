import { NextResponse } from "next/server";

import { getCurrentUser } from "@/features/auth/services/auth-service";
import { journalEntrySchema } from "@/features/journal/schemas/journal-schemas";
import {
  getJournalWorkspace,
  upsertJournalEntry,
} from "@/features/journal/services/journal-service";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const data = await getJournalWorkspace(user.id);
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const parsed = journalEntrySchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Invalid journal input.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  await upsertJournalEntry(user.id, parsed.data);
  const data = await getJournalWorkspace(user.id);

  return NextResponse.json({
    data,
    message: "Journal entry saved.",
  });
}
