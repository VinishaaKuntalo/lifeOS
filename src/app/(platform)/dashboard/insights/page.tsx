import { requireUser } from "@/features/auth/services/auth-service";
import { InsightsDashboard } from "@/features/insights/components/insights-dashboard";
import { insightProvider } from "@/features/insights/services/insight-service";

export default async function InsightsPage() {
  const user = await requireUser();
  const digest = await insightProvider.generateWeeklyDigest(user.id);

  return <InsightsDashboard digest={digest} />;
}
