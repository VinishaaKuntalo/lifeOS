import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type FeaturePlaceholderProps = {
  eyebrow: string;
  title: string;
  description: string;
  highlights: string[];
};

export function FeaturePlaceholder({
  eyebrow,
  title,
  description,
  highlights,
}: FeaturePlaceholderProps) {
  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-[0.25em] text-primary">
          {eyebrow}
        </p>
        <h2 className="text-3xl font-semibold tracking-tight">{title}</h2>
        <p className="max-w-3xl text-muted-foreground">{description}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {highlights.map((highlight) => (
          <Card
            key={highlight}
            className="border-border/70 bg-card/70 backdrop-blur"
          >
            <CardHeader>
              <CardTitle className="text-lg">{highlight}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              This route is ready for the feature implementation pass and
              already lives inside the protected dashboard shell.
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
