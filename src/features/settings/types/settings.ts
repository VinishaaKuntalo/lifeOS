export type ProfileSettings = {
  user_id: string;
  email: string;
  full_name: string | null;
  timezone: string;
  locale: string;
  currency_code: string;
  theme_preference: string;
  notifications_enabled: boolean;
  height_cm: number | null;
};

export type SettingsWorkspaceData = {
  profile: ProfileSettings;
  exportPreview: {
    habits: number;
    tasks: number;
    goals: number;
    journalEntries: number;
    healthMetrics: number;
    financeTransactions: number;
  };
};
