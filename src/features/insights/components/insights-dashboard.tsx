import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import type { InsightDigest } from "@/features/insights/types/insight";

export function InsightsDashboard({ digest }: { digest: InsightDigest }) {
  return (
    <section className="grid gap-6 xl:grid-cols-3">
      <InsightCard title="Wins" items={digest.wins} />
      <InsightCard title="Patterns" items={digest.patterns} />
      <InsightCard title="Suggestions" items={digest.suggestions} />
    </section>
  );
}

function InsightCard({ title, items }: { title: string; items: string[] }) {
  return (
    <Card className="border-border/70 bg-card/70">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => (
          <p key={item} className="text-sm text-muted-foreground">
            {item}
          </p>
        ))}
      </CardContent>
    </Card>
  );
}
