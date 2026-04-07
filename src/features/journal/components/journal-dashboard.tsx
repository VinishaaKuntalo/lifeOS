"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils/cn";

import type {
  JournalEntry,
  JournalMood,
  JournalWorkspaceData,
} from "@/features/journal/types/journal";
import {
  useUpsertJournalEntryMutation,
  useJournalWorkspace,
} from "@/features/journal/hooks/use-journal-query";

const moods: Array<{ value: JournalMood; label: string }> = [
  { value: "great", label: "Great" },
  { value: "good", label: "Good" },
  { value: "neutral", label: "Neutral" },
  { value: "low", label: "Low" },
  { value: "bad", label: "Bad" },
];

type JournalDashboardProps = {
  initialData: JournalWorkspaceData;
};

type JournalFormValues = {
  entryDate: string;
  title: string;
  mood: JournalMood | "";
};

export function JournalDashboard({ initialData }: JournalDashboardProps) {
  const { data, isError, refetch } = useJournalWorkspace(initialData);
  const mutation = useUpsertJournalEntryMutation();
  const [search, setSearch] = useState("");
  const [moodFilter, setMoodFilter] = useState<JournalMood | "all">("all");
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(
    initialData.entries[0] ?? null,
  );

  const form = useForm<JournalFormValues>({
    defaultValues: {
      entryDate: initialData.today,
      title: selectedEntry?.title ?? "",
      mood: selectedEntry?.mood ?? "",
    },
  });

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder:
          "Write about today, what mattered, what changed, and what you noticed.",
      }),
    ],
    content: selectedEntry?.content_json ?? {
      type: "doc",
      content: [{ type: "paragraph" }],
    },
    editorProps: {
      attributes: {
        class:
          "min-h-[260px] rounded-xl border border-border/70 bg-background/40 px-4 py-3 outline-none",
      },
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    if (!selectedEntry) {
      form.reset({
        entryDate: data?.today ?? initialData.today,
        title: "",
        mood: "",
      });
      editor?.commands.setContent({
        type: "doc",
        content: [{ type: "paragraph" }],
      });
      return;
    }

    form.reset({
      entryDate: selectedEntry.entry_date,
      title: selectedEntry.title ?? "",
      mood: selectedEntry.mood ?? "",
    });
    editor?.commands.setContent(selectedEntry.content_json);
  }, [selectedEntry, form, editor, data?.today, initialData.today]);

  const filteredEntries = useMemo(() => {
    return (data?.entries ?? []).filter((entry) => {
      const matchesSearch =
        !search ||
        entry.title?.toLowerCase().includes(search.toLowerCase()) ||
        entry.content_text.toLowerCase().includes(search.toLowerCase());
      const matchesMood = moodFilter === "all" || entry.mood === moodFilter;
      return matchesSearch && matchesMood;
    });
  }, [data?.entries, search, moodFilter]);

  const saveEntry = form.handleSubmit(async (values) => {
    if (!editor) {
      return;
    }

    await mutation.mutateAsync({
      entryDate: values.entryDate,
      title: values.title,
      mood: values.mood || null,
      contentJson: editor.getJSON() as Record<string, unknown>,
      contentText: editor.getText(),
    });
  });

  if (isError || !data) {
    return (
      <Card className="border-destructive/30 bg-destructive/5">
        <CardHeader>
          <CardTitle>Unable to load journal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            We couldn&apos;t load your journal right now.
          </p>
          <Button onClick={() => void refetch()}>Retry</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <section className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Entries" value={data.summary.totalEntries} />
        <SummaryCard label="Words written" value={data.summary.totalWords} />
        <SummaryCard
          label="Current streak"
          value={data.summary.currentStreak}
        />
        <SummaryCard label="Best streak" value={data.summary.longestStreak} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[340px_1fr]">
        <Card className="border-border/70 bg-card/70">
          <CardHeader>
            <CardTitle>Entries</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search entries"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <select
              className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
              value={moodFilter}
              onChange={(event) =>
                setMoodFilter(event.target.value as JournalMood | "all")
              }
            >
              <option value="all">All moods</option>
              {moods.map((mood) => (
                <option key={mood.value} value={mood.value}>
                  {mood.label}
                </option>
              ))}
            </select>
            <div className="space-y-3">
              {filteredEntries.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => setSelectedEntry(entry)}
                  className={cn(
                    "w-full rounded-xl border px-4 py-3 text-left transition",
                    selectedEntry?.id === entry.id
                      ? "border-primary bg-primary/10"
                      : "border-border/70 bg-secondary/20",
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">
                      {entry.title || "Untitled entry"}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {entry.entry_date}
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                    {entry.content_text || "No content yet."}
                  </p>
                </button>
              ))}
              {!filteredEntries.length && (
                <div className="rounded-xl border border-dashed border-border/70 px-4 py-6 text-sm text-muted-foreground">
                  No entries match this filter.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/70">
          <CardHeader>
            <CardTitle>Daily entry</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={saveEntry}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="entryDate">Date</Label>
                  <Input
                    id="entryDate"
                    type="date"
                    {...form.register("entryDate")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mood">Mood</Label>
                  <select
                    id="mood"
                    className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                    {...form.register("mood")}
                  >
                    <option value="">No mood tag</option>
                    {moods.map((mood) => (
                      <option key={mood.value} value={mood.value}>
                        {mood.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="A short title for today"
                  {...form.register("title")}
                />
              </div>
              <div className="space-y-2">
                <Label>Entry</Label>
                <EditorContent editor={editor} />
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Word count:{" "}
                  {editor?.getText().trim().split(/\s+/).filter(Boolean)
                    .length ?? 0}
                </p>
                <Button type="submit" disabled={!editor || mutation.isPending}>
                  Save entry
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <Card className="border-border/70 bg-card/70">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-semibold tracking-tight">{value}</div>
      </CardContent>
    </Card>
  );
}
