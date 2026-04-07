"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  fetchJournalWorkspace,
  upsertJournalEntryRequest,
} from "@/features/journal/api/journal-client";
import type { JournalWorkspaceData } from "@/features/journal/types/journal";

export const journalQueryKey = ["journal-workspace"] as const;

export function useJournalWorkspace(initialData: JournalWorkspaceData) {
  return useQuery({
    queryKey: journalQueryKey,
    queryFn: fetchJournalWorkspace,
    initialData,
  });
}

export function useUpsertJournalEntryMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: upsertJournalEntryRequest,
    onSuccess: (result) => {
      queryClient.setQueryData(journalQueryKey, result.data);
      toast.success(result.message);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
