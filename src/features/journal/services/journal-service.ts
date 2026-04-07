import "server-only";

import { getTodayDateKey, subtractDays } from "@/lib/utils/date";
import { createClient } from "@/lib/supabase/server";

import type {
  JournalEntry,
  JournalWorkspaceData,
} from "@/features/journal/types/journal";
import type { JournalEntryInput } from "@/features/journal/schemas/journal-schemas";

type ProfileRow = {
  timezone: string | null;
};

async function getUserTimezone(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("timezone")
    .eq("user_id", userId)
    .single<ProfileRow>();

  return data?.timezone ?? "UTC";
}

function countWords(text: string) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

function buildStreaks(entries: JournalEntry[], today: string) {
  const dates = Array.from(
    new Set(entries.map((entry) => entry.entry_date)),
  ).sort();
  const dateSet = new Set(dates);

  let current = 0;
  let cursor = today;
  while (dateSet.has(cursor)) {
    current += 1;
    cursor = subtractDays(cursor, 1);
  }

  let longest = 0;
  let running = 0;
  let previous: string | null = null;

  for (const date of dates) {
    if (previous && subtractDays(date, 1) === previous) {
      running += 1;
    } else {
      running = 1;
    }

    previous = date;
    longest = Math.max(longest, running);
  }

  return { current, longest };
}

export async function getJournalWorkspace(
  userId: string,
): Promise<JournalWorkspaceData> {
  const supabase = await createClient();
  const timeZone = await getUserTimezone(userId);
  const today = getTodayDateKey(timeZone);
  const start = subtractDays(today, 365);

  const { data, error } = await supabase
    .from("journal_entries")
    .select("*")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .gte("entry_date", start)
    .order("entry_date", { ascending: false })
    .returns<JournalEntry[]>();

  if (error) {
    throw new Error(error.message);
  }

  const entries = data ?? [];
  const streaks = buildStreaks(entries, today);

  return {
    today,
    summary: {
      totalEntries: entries.length,
      totalWords: entries.reduce((sum, entry) => sum + entry.word_count, 0),
      currentStreak: streaks.current,
      longestStreak: streaks.longest,
    },
    entries,
  };
}

export async function upsertJournalEntry(
  userId: string,
  input: JournalEntryInput,
) {
  const supabase = await createClient();
  const wordCount = countWords(input.contentText);

  const existingQuery = supabase
    .from("journal_entries")
    .select("id")
    .eq("user_id", userId)
    .eq("entry_date", input.entryDate)
    .is("deleted_at", null)
    .maybeSingle<{ id: string }>();

  const { data: existing, error: existingError } = await existingQuery;

  if (existingError) {
    throw new Error(existingError.message);
  }

  const payload = {
    title: input.title?.trim() || null,
    content_json: input.contentJson,
    content_text: input.contentText,
    mood: input.mood ?? null,
    word_count: wordCount,
  };

  if (existing?.id) {
    const { error } = await supabase
      .from("journal_entries")
      .update(payload)
      .eq("id", existing.id)
      .eq("user_id", userId);

    if (error) {
      throw new Error(error.message);
    }

    return;
  }

  const { error } = await supabase.from("journal_entries").insert({
    user_id: userId,
    entry_date: input.entryDate,
    ...payload,
  });

  if (error) {
    throw new Error(error.message);
  }
}
