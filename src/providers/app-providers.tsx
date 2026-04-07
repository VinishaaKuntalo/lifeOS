"use client";

import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";

import { PwaRegistration } from "@/components/shared/pwa-registration";
import { QueryProvider } from "@/providers/query-provider";

type AppProvidersProps = {
  children: React.ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <QueryProvider>
        <PwaRegistration />
        {children}
        <Toaster richColors position="top-right" />
      </QueryProvider>
    </ThemeProvider>
  );
}
