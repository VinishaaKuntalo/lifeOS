import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type AuthShellProps = {
  title: string;
  description: string;
  footer: React.ReactNode;
  children: React.ReactNode;
};

export function AuthShell({
  title,
  description,
  footer,
  children,
}: AuthShellProps) {
  return (
    <main className="container flex min-h-screen items-center justify-center py-12">
      <div className="grid w-full max-w-5xl gap-10 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="flex flex-col justify-center space-y-6">
          <Link
            href="/"
            className="text-sm font-medium uppercase tracking-[0.3em] text-primary"
          >
            LifeOS
          </Link>
          <div className="space-y-4">
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              Build a calmer system for the parts of life that usually live in
              six different apps.
            </h1>
            <p className="max-w-xl text-base text-muted-foreground sm:text-lg">
              Secure server-rendered auth, a modular dashboard, and domain
              boundaries designed to scale as the product grows.
            </p>
          </div>
        </section>
        <Card className="border-border/70 bg-card/80 shadow-xl backdrop-blur">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl">{title}</CardTitle>
            <p className="text-sm text-muted-foreground">{description}</p>
          </CardHeader>
          <CardContent className="space-y-6">
            {children}
            <div className="text-sm text-muted-foreground">{footer}</div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
