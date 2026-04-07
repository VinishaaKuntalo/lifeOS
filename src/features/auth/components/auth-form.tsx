"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { APP_ROUTES } from "@/lib/constants/routes";

import {
  googleOAuthAction,
  loginAction,
  signupAction,
} from "@/features/auth/actions/auth-actions";
import {
  loginSchema,
  signupSchema,
  type LoginInput,
  type SignupInput,
} from "@/features/auth/schemas/auth-schemas";

type AuthFormProps =
  | {
      mode: "login";
      redirectTo?: string;
    }
  | {
      mode: "signup";
      redirectTo?: string;
    };

export function AuthForm({ mode, redirectTo }: AuthFormProps) {
  const [serverMessage, setServerMessage] = useState<{
    tone: "default" | "destructive";
    text: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const loginForm = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const signupForm = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onLoginSubmit = loginForm.handleSubmit((values) => {
    setServerMessage(null);

    startTransition(async () => {
      const result = await loginAction(values);

      if (!result.success) {
        Object.entries(result.fieldErrors ?? {}).forEach(
          ([field, messages]) => {
            if (!messages?.length) {
              return;
            }

            loginForm.setError(field as keyof LoginInput, {
              message: messages[0],
            });
          },
        );

        setServerMessage({
          tone: "destructive",
          text: result.message,
        });
        return;
      }

      setServerMessage({
        tone: "default",
        text: result.message,
      });

      const nextRoute = redirectTo ?? result.redirectTo;

      if (nextRoute) {
        window.location.assign(nextRoute);
      }
    });
  });

  const onSignupSubmit = signupForm.handleSubmit((values) => {
    setServerMessage(null);

    startTransition(async () => {
      const result = await signupAction(values);

      if (!result.success) {
        Object.entries(result.fieldErrors ?? {}).forEach(
          ([field, messages]) => {
            if (!messages?.length) {
              return;
            }

            signupForm.setError(field as keyof SignupInput, {
              message: messages[0],
            });
          },
        );

        setServerMessage({
          tone: "destructive",
          text: result.message,
        });
        return;
      }

      setServerMessage({
        tone: "default",
        text: result.message,
      });

      const nextRoute = redirectTo ?? result.redirectTo;

      if (nextRoute) {
        window.location.assign(nextRoute);
      }
    });
  });

  const startGoogleAuth = () => {
    setServerMessage(null);

    startTransition(async () => {
      const result = await googleOAuthAction();

      if (!result.success || !result.redirectTo) {
        setServerMessage({
          tone: "destructive",
          text: result.message,
        });
        return;
      }

      window.location.assign(result.redirectTo);
    });
  };

  return (
    <div className="space-y-6">
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={startGoogleAuth}
        disabled={isPending}
      >
        Continue with Google
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 tracking-[0.25em] text-muted-foreground">
            Or continue with email
          </span>
        </div>
      </div>

      <form
        className="space-y-4"
        onSubmit={mode === "login" ? onLoginSubmit : onSignupSubmit}
      >
        {mode === "signup" && (
          <div className="space-y-2">
            <Label htmlFor="fullName">Full name</Label>
            <Input
              id="fullName"
              placeholder="Alex Johnson"
              {...signupForm.register("fullName")}
            />
            <FieldError
              message={signupForm.formState.errors.fullName?.message}
            />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            {...(mode === "login"
              ? loginForm.register("email")
              : signupForm.register("email"))}
          />
          <FieldError
            message={
              mode === "login"
                ? loginForm.formState.errors.email?.message
                : signupForm.formState.errors.email?.message
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="At least 8 characters"
            autoComplete={
              mode === "login" ? "current-password" : "new-password"
            }
            {...(mode === "login"
              ? loginForm.register("password")
              : signupForm.register("password"))}
          />
          <FieldError
            message={
              mode === "login"
                ? loginForm.formState.errors.password?.message
                : signupForm.formState.errors.password?.message
            }
          />
        </div>

        {mode === "signup" && (
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Repeat your password"
              autoComplete="new-password"
              {...signupForm.register("confirmPassword")}
            />
            <FieldError
              message={signupForm.formState.errors.confirmPassword?.message}
            />
          </div>
        )}

        {serverMessage && (
          <Alert variant={serverMessage.tone}>{serverMessage.text}</Alert>
        )}

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending
            ? "Please wait..."
            : mode === "login"
              ? "Sign in"
              : "Create account"}
        </Button>
      </form>

      <p className="text-sm text-muted-foreground">
        {mode === "login" ? (
          <>
            New to LifeOS?{" "}
            <Link
              className="text-primary hover:underline"
              href={APP_ROUTES.signup}
            >
              Create an account
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link
              className="text-primary hover:underline"
              href={APP_ROUTES.login}
            >
              Sign in
            </Link>
          </>
        )}
      </p>
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-sm text-destructive">{message}</p>;
}
