export type AuthActionState = {
  success: boolean;
  message: string;
  redirectTo?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export type AuthUser = {
  id: string;
  email: string;
  fullName: string | null;
};
