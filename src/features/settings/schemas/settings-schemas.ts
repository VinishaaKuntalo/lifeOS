import { z } from "zod";

export const profileSettingsSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  timezone: z.string().trim().min(2).max(64),
  locale: z.string().trim().min(2).max(16),
  currencyCode: z.string().trim().length(3),
  themePreference: z.enum(["dark", "light", "system"]),
  notificationsEnabled: z.boolean(),
  heightCm: z.coerce.number().min(0).optional(),
});

export type ProfileSettingsInput = z.infer<typeof profileSettingsSchema>;
