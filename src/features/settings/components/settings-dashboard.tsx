"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  profileSettingsSchema,
  type ProfileSettingsInput,
} from "@/features/settings/schemas/settings-schemas";
import type { SettingsWorkspaceData } from "@/features/settings/types/settings";

type SettingsDashboardProps = {
  initialData: SettingsWorkspaceData;
};

export function SettingsDashboard({ initialData }: SettingsDashboardProps) {
  const [busy, setBusy] = useState(false);
  const form = useForm<ProfileSettingsInput>({
    resolver: zodResolver(profileSettingsSchema),
    defaultValues: {
      fullName: initialData.profile.full_name ?? "",
      timezone: initialData.profile.timezone,
      locale: initialData.profile.locale,
      currencyCode: initialData.profile.currency_code,
      themePreference: initialData.profile.theme_preference as
        | "dark"
        | "light"
        | "system",
      notificationsEnabled: initialData.profile.notifications_enabled,
      heightCm: initialData.profile.height_cm ?? undefined,
    },
  });

  const save = form.handleSubmit(async (values) => {
    setBusy(true);
    try {
      const response = await fetch("/api/settings/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!response.ok) {
        throw new Error("Unable to update settings.");
      }
      toast.success("Settings saved.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to update settings.",
      );
    } finally {
      setBusy(false);
    }
  });

  const exportData = async () => {
    const response = await fetch("/api/settings/export");
    const payload = await response.json();
    await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    toast.success("Export copied to clipboard.");
  };

  const requestDelete = async () => {
    const confirmed = window.confirm(
      "This will mark your account data for deletion. Continue?",
    );
    if (!confirmed) {
      return;
    }

    const response = await fetch("/api/settings/delete-account", {
      method: "POST",
    });
    const payload = (await response.json()) as { message?: string };
    if (!response.ok) {
      toast.error(payload.message ?? "Unable to delete account.");
      return;
    }

    toast.success(payload.message ?? "Account deletion scheduled.");
  };

  return (
    <section className="grid gap-6 xl:grid-cols-[1fr_340px]">
      <Card className="border-border/70 bg-card/70">
        <CardHeader>
          <CardTitle>Profile settings</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={save}>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Full name">
                <Input {...form.register("fullName")} />
              </Field>
              <Field label="Timezone">
                <Input {...form.register("timezone")} />
              </Field>
              <Field label="Locale">
                <Input {...form.register("locale")} />
              </Field>
              <Field label="Currency">
                <Input {...form.register("currencyCode")} />
              </Field>
              <Field label="Theme">
                <select
                  className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                  {...form.register("themePreference")}
                >
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                  <option value="system">System</option>
                </select>
              </Field>
              <Field label="Height (cm)">
                <Input
                  type="number"
                  step="0.1"
                  {...form.register("heightCm")}
                />
              </Field>
            </div>
            <Label className="flex items-center gap-2">
              <input
                type="checkbox"
                {...form.register("notificationsEnabled")}
              />
              Enable notifications
            </Label>
            <Button type="submit" disabled={busy}>
              Save settings
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card className="border-border/70 bg-card/70">
          <CardHeader>
            <CardTitle>Data export</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Habits: {initialData.exportPreview.habits}</p>
            <p>Tasks: {initialData.exportPreview.tasks}</p>
            <p>Goals: {initialData.exportPreview.goals}</p>
            <p>Journal entries: {initialData.exportPreview.journalEntries}</p>
            <p>Health metrics: {initialData.exportPreview.healthMetrics}</p>
            <p>
              Finance transactions:{" "}
              {initialData.exportPreview.financeTransactions}
            </p>
            <Button onClick={exportData}>Copy export JSON</Button>
          </CardContent>
        </Card>

        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader>
            <CardTitle>Danger zone</CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" onClick={requestDelete}>
              Delete account
            </Button>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
