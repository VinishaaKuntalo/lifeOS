import { requireUser } from "@/features/auth/services/auth-service";
import { SettingsDashboard } from "@/features/settings/components/settings-dashboard";
import { getSettingsWorkspace } from "@/features/settings/services/settings-service";

export default async function SettingsPage() {
  const user = await requireUser();
  const initialData = await getSettingsWorkspace(user.id);

  return <SettingsDashboard initialData={initialData} />;
}
