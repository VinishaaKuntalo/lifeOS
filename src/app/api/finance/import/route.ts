import { NextResponse } from "next/server";

import { getCurrentUser } from "@/features/auth/services/auth-service";
import { csvImportSchema } from "@/features/finance/schemas/finance-schemas";
import {
  getFinanceWorkspace,
  importTransactionsFromCsv,
} from "@/features/finance/services/finance-service";

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const parsed = csvImportSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Invalid CSV payload.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  await importTransactionsFromCsv(user.id, parsed.data);
  const data = await getFinanceWorkspace(user.id);

  return NextResponse.json({
    data,
    message: "CSV import complete.",
  });
}
