export default function OfflinePage() {
  return (
    <main className="container flex min-h-screen items-center justify-center py-16">
      <div className="max-w-xl space-y-4 text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-primary">
          Offline
        </p>
        <h1 className="text-4xl font-semibold tracking-tight">
          LifeOS is temporarily offline.
        </h1>
        <p className="text-muted-foreground">
          Your installed app shell is still available. Reconnect to sync changes
          and load fresh data from Supabase.
        </p>
      </div>
    </main>
  );
}
