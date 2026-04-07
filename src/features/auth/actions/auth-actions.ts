"use server";

import { revalidatePath } from "next/cache";

import { APP_ROUTES } from "@/lib/constants/routes";

import {
  loginSchema,
  signupSchema,
} from "@/features/auth/schemas/auth-schemas";
import {
  signInWithGoogle,
  signInWithPassword,
  signOut,
  signUpWithPassword,
} from "@/features/auth/services/auth-service";
import type { AuthActionState } from "@/features/auth/types/auth";

function fromZodError(error: {
  flatten: () => { fieldErrors: Record<string, string[] | undefined> };
}): AuthActionState {
  return {
    success: false,
    message: "Please correct the highlighted fields.",
    fieldErrors: error.flatten().fieldErrors,
  };
}

export async function loginAction(
  input: FormData | Record<string, unknown>,
): Promise<AuthActionState> {
  const values =
    input instanceof FormData ? Object.fromEntries(input.entries()) : input;
  const parsed = loginSchema.safeParse(values);

  if (!parsed.success) {
    return fromZodError(parsed.error);
  }

  const result = await signInWithPassword(parsed.data);

  if (result.success) {
    revalidatePath(APP_ROUTES.dashboard);
  }

  return result;
}

export async function signupAction(
  input: FormData | Record<string, unknown>,
): Promise<AuthActionState> {
  const values =
    input instanceof FormData ? Object.fromEntries(input.entries()) : input;
  const parsed = signupSchema.safeParse(values);

  if (!parsed.success) {
    return fromZodError(parsed.error);
  }

  return signUpWithPassword(parsed.data);
}

export async function googleOAuthAction(): Promise<AuthActionState> {
  return signInWithGoogle();
}

export async function signOutAction() {
  await signOut();
  revalidatePath(APP_ROUTES.home);
  revalidatePath(APP_ROUTES.dashboard);
}
