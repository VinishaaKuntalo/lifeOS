import { NextResponse } from "next/server";

import { getCurrentUser } from "@/features/auth/services/auth-service";
import { financeTransactionSchema } from "@/features/finance/schemas/finance-schemas";
import {
  createTransaction,
  getFinanceWorkspace,
} from "@/features/finance/services/finance-service";

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const parsed = financeTransactionSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Invalid transaction input.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  await createTransaction(user.id, parsed.data);
  const data = await getFinanceWorkspace(user.id);

  return NextResponse.json({
    data,
    message: "Transaction created.",
  });
}
