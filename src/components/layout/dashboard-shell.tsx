"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import {
  BookOpenText,
  HeartPulse,
  LayoutDashboard,
  ListTodo,
  Menu,
  X,
  PiggyBank,
  Sparkles,
  Target,
  Trophy,
  Settings,
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { SignOutButton } from "@/features/auth/components/sign-out-button";
import { cn } from "@/lib/utils/cn";
import { APP_ROUTES } from "@/lib/constants/routes";

type DashboardShellProps = {
  user: {
    email: string;
    fullName: string | null;
  };
  children: React.ReactNode;
};

const navigation = [
  {
    href: APP_ROUTES.dashboard as Route,
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  { href: APP_ROUTES.dashboardHabits as Route, label: "Habits", icon: Trophy },
  { href: APP_ROUTES.dashboardTasks as Route, label: "Tasks", icon: ListTodo },
  { href: APP_ROUTES.dashboardGoals as Route, label: "Goals", icon: Target },
  {
    href: APP_ROUTES.dashboardJournal as Route,
    label: "Journal",
    icon: BookOpenText,
  },
  {
    href: APP_ROUTES.dashboardHealth as Route,
    label: "Health",
    icon: HeartPulse,
  },
  {
    href: APP_ROUTES.dashboardFinance as Route,
    label: "Finance",
    icon: PiggyBank,
  },
  {
    href: APP_ROUTES.dashboardInsights as Route,
    label: "AI Insights",
    icon: Sparkles,
  },
  {
    href: APP_ROUTES.dashboardSettings as Route,
    label: "Settings",
    icon: Settings,
  },
];

export function DashboardShell({ children, user }: DashboardShellProps) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background [background-image:radial-gradient(circle_at_top_left,rgba(56,189,248,0.18),transparent_28%),radial-gradient(circle_at_top_right,rgba(20,184,166,0.14),transparent_26%),radial-gradient(circle_at_bottom,rgba(15,23,42,0.4),transparent_40%)]">
      <div className="grid min-h-screen lg:grid-cols-[260px_1fr]">
        <aside className="hidden border-r border-border/70 bg-slate-950/70 px-6 py-8 backdrop-blur lg:block">
          <div className="space-y-10">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.3em] text-primary">
                LifeOS
              </p>
              <h2 className="text-2xl font-semibold tracking-tight">
                Command center
              </h2>
            </div>
            <nav className="space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition",
                      pathname === item.href
                        ? "bg-primary/15 text-foreground"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>
        <div className="flex min-h-screen flex-col">
          <header className="border-b border-border/70 bg-slate-950/65 px-4 py-4 backdrop-blur lg:px-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="lg:hidden"
                  onClick={() => setMobileNavOpen((open) => !open)}
                  aria-label="Toggle navigation"
                >
                  {mobileNavOpen ? (
                    <X className="h-4 w-4" />
                  ) : (
                    <Menu className="h-4 w-4" />
                  )}
                </Button>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Signed in as {user.email}
                  </p>
                  <h1 className="text-xl font-semibold tracking-tight">
                    {user.fullName ?? "Dashboard"}
                  </h1>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <ThemeToggle />
                <SignOutButton />
              </div>
            </div>
          </header>
          {mobileNavOpen && (
            <div className="border-b border-border/70 bg-slate-950/90 px-4 py-4 backdrop-blur lg:hidden">
              <nav className="grid gap-2">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileNavOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition",
                        pathname === item.href
                          ? "bg-primary/15 text-foreground"
                          : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>
          )}
          <main className="flex-1 px-4 py-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
