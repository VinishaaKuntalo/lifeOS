import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_ROUTES } from "@/lib/constants/routes";
import { cn } from "@/lib/utils/cn";

const pillars = [
  "Habits with timezone-safe logging",
  "GTD tasks with drag-and-drop workflows",
  "Goals, milestones, and linked execution",
  "Journal, health, finance, and AI digests",
];

export default function MarketingPage() {
  return (
    <main className="container flex min-h-screen flex-col justify-center py-16">
      <div className="mx-auto flex max-w-5xl flex-col gap-10">
        <div className="flex items-center justify-end gap-3">
          <Link
            className={cn(buttonVariants({ variant: "ghost" }))}
            href={APP_ROUTES.login}
          >
            Sign in
          </Link>
          <Link className={cn(buttonVariants())} href={APP_ROUTES.signup}>
            Create account
          </Link>
        </div>
        <div className="space-y-6 text-center">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-primary">
            Personal operating system
          </p>
          <div className="space-y-4">
            <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-6xl">
              LifeOS brings your habits, tasks, goals, health, and money into
              one calm workspace.
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              Built for scale from day one with secure Supabase services,
              server-rendered auth, and a modular Next.js architecture.
            </p>
          </div>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              className={cn(buttonVariants({ size: "lg" }))}
              href={APP_ROUTES.signup}
            >
              Start with email
            </Link>
            <Link
              className={cn(buttonVariants({ size: "lg", variant: "outline" }))}
              href={APP_ROUTES.login}
            >
              I already have an account
            </Link>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {pillars.map((pillar) => (
            <Card
              key={pillar}
              className="border-border/70 bg-card/70 backdrop-blur"
            >
              <CardHeader>
                <CardTitle className="text-lg">{pillar}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Scaffolded with clean boundaries so each feature can grow
                independently without leaking business logic into the UI.
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}
