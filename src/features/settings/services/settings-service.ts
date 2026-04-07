import "server-only";

import { getServerEnv } from "@/lib/env/server";
import { createClient } from "@/lib/supabase/server";

import type { ProfileSettingsInput } from "@/features/settings/schemas/settings-schemas";
import type {
  ProfileSettings,
  SettingsWorkspaceData,
} from "@/features/settings/types/settings";

export async function getSettingsWorkspace(
  userId: string,
): Promise<SettingsWorkspaceData> {
  const supabase = await createClient();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .single<ProfileSettings>();

  if (error || !profile) {
    throw new Error(error?.message ?? "Unable to load profile settings.");
  }

  const [
    { count: habits },
    { count: tasks },
    { count: goals },
    { count: journalEntries },
    { count: healthMetrics },
    { count: financeTransactions },
  ] = await Promise.all([
    supabase
      .from("habits")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .is("deleted_at", null),
    supabase
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .is("deleted_at", null),
    supabase
      .from("goals")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .is("deleted_at", null),
    supabase
      .from("journal_entries")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .is("deleted_at", null),
    supabase
      .from("health_metrics")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .is("deleted_at", null),
    supabase
      .from("finance_transactions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .is("deleted_at", null),
  ]);

  return {
    profile,
    exportPreview: {
      habits: habits ?? 0,
      tasks: tasks ?? 0,
      goals: goals ?? 0,
      journalEntries: journalEntries ?? 0,
      healthMetrics: healthMetrics ?? 0,
      financeTransactions: financeTransactions ?? 0,
    },
  };
}

export async function updateProfileSettings(
  userId: string,
  input: ProfileSettingsInput,
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: input.fullName,
      timezone: input.timezone,
      locale: input.locale,
      currency_code: input.currencyCode,
      theme_preference: input.themePreference,
      notifications_enabled: input.notificationsEnabled,
      height_cm: typeof input.heightCm === "number" ? input.heightCm : null,
    })
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function exportUserData(userId: string) {
  const supabase = await createClient();
  const [
    profile,
    habits,
    tasks,
    goals,
    journalEntries,
    healthMetrics,
    financeTransactions,
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("user_id", userId),
    supabase.from("habits").select("*").eq("user_id", userId),
    supabase.from("tasks").select("*").eq("user_id", userId),
    supabase.from("goals").select("*").eq("user_id", userId),
    supabase.from("journal_entries").select("*").eq("user_id", userId),
    supabase.from("health_metrics").select("*").eq("user_id", userId),
    supabase.from("finance_transactions").select("*").eq("user_id", userId),
  ]);

  return {
    profile: profile.data ?? [],
    habits: habits.data ?? [],
    tasks: tasks.data ?? [],
    goals: goals.data ?? [],
    journalEntries: journalEntries.data ?? [],
    healthMetrics: healthMetrics.data ?? [],
    financeTransactions: financeTransactions.data ?? [],
    exportedAt: new Date().toISOString(),
  };
}

export async function deleteAccount(userId: string) {
  const env = getServerEnv();
  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is required for account deletion.",
    );
  }

  const supabase = await createClient();
  await Promise.all([
    supabase
      .from("profiles")
      .update({ deleted_at: new Date().toISOString() })
      .eq("user_id", userId),
    supabase
      .from("habits")
      .update({ deleted_at: new Date().toISOString() })
      .eq("user_id", userId),
    supabase
      .from("tasks")
      .update({ deleted_at: new Date().toISOString() })
      .eq("user_id", userId),
    supabase
      .from("goals")
      .update({ deleted_at: new Date().toISOString() })
      .eq("user_id", userId),
    supabase
      .from("journal_entries")
      .update({ deleted_at: new Date().toISOString() })
      .eq("user_id", userId),
    supabase
      .from("health_metrics")
      .update({ deleted_at: new Date().toISOString() })
      .eq("user_id", userId),
    supabase
      .from("finance_transactions")
      .update({ deleted_at: new Date().toISOString() })
      .eq("user_id", userId),
  ]);
}
