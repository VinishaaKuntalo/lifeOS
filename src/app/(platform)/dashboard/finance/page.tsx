import { requireUser } from "@/features/auth/services/auth-service";
import { FinanceDashboard } from "@/features/finance/components/finance-dashboard";
import { getFinanceWorkspace } from "@/features/finance/services/finance-service";

export default async function FinancePage() {
  const user = await requireUser();
  const initialData = await getFinanceWorkspace(user.id);

  return <FinanceDashboard initialData={initialData} />;
}
