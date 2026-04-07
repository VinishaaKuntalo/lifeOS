import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { APP_ROUTES } from "@/lib/constants/routes";
import { getClientEnv } from "@/lib/env/client";
import { logger } from "@/lib/logging/logger";
import { createClient } from "@/lib/supabase/server";

import type { AuthActionState, AuthUser } from "@/features/auth/types/auth";

import type {
  LoginInput,
  SignupInput,
} from "@/features/auth/schemas/auth-schemas";

function buildRedirectUrl(path: string) {
  const env = getClientEnv();

  return new URL(path, env.NEXT_PUBLIC_APP_URL).toString();
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

export async function signInWithPassword(
  values: LoginInput,
): Promise<AuthActionState> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword(values);

    if (error) {
      logger.warn("Failed password sign-in", { error: error.message });
      return {
        success: false,
        message: error.message,
      };
    }

    return {
      success: true,
      message: "Signed in successfully.",
      redirectTo: APP_ROUTES.dashboard,
    };
  } catch (error) {
    logger.error("Unexpected sign-in failure", { error });
    return {
      success: false,
      message: getErrorMessage(error, "Unable to sign in right now."),
    };
  }
}

export async function signUpWithPassword(
  values: SignupInput,
): Promise<AuthActionState> {
  try {
    const supabase = await createClient();
    const emailRedirectTo = buildRedirectUrl(APP_ROUTES.authCallback);
    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        emailRedirectTo,
        data: {
          full_name: values.fullName,
        },
      },
    });

    if (error) {
      logger.warn("Failed password sign-up", { error: error.message });
      return {
        success: false,
        message: error.message,
      };
    }

    return {
      success: true,
      message:
        "Account created. Check your inbox to confirm your email before signing in.",
      redirectTo: APP_ROUTES.login,
    };
  } catch (error) {
    logger.error("Unexpected sign-up failure", { error });
    return {
      success: false,
      message: getErrorMessage(error, "Unable to create your account."),
    };
  }
}

export async function signInWithGoogle(): Promise<AuthActionState> {
  try {
    const supabase = await createClient();
    const origin =
      headers().get("origin") ?? getClientEnv().NEXT_PUBLIC_APP_URL;
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}${APP_ROUTES.authCallback}`,
      },
    });

    if (error || !data.url) {
      logger.warn("Failed Google OAuth start", { error: error?.message });
      return {
        success: false,
        message: error?.message ?? "Unable to start Google sign-in.",
      };
    }

    return {
      success: true,
      message: "Redirecting to Google.",
      redirectTo: data.url,
    };
  } catch (error) {
    logger.error("Unexpected Google OAuth failure", { error });
    return {
      success: false,
      message: getErrorMessage(error, "Unable to start Google sign-in."),
    };
  }
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    logger.error("Failed to sign out", { error: error.message });
    throw new Error(error.message);
  }
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email ?? "",
    fullName:
      (typeof user.user_metadata.full_name === "string" &&
        user.user_metadata.full_name) ||
      (typeof user.user_metadata.name === "string" &&
        user.user_metadata.name) ||
      null,
  };
}

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect(APP_ROUTES.login);
  }

  return user;
}
