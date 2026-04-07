import { requireUser } from "@/features/auth/services/auth-service";
import { JournalDashboard } from "@/features/journal/components/journal-dashboard";
import { getJournalWorkspace } from "@/features/journal/services/journal-service";

export default async function JournalPage() {
  const user = await requireUser();
  const initialData = await getJournalWorkspace(user.id);

  return <JournalDashboard initialData={initialData} />;
}
