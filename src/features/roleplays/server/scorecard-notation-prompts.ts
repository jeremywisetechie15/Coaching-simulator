import type { SupabaseClient } from "@supabase/supabase-js";
import { PUBLISHED_CONTENT_STATUS } from "@/features/content/domain";

export const SCORECARD_NOTATION_PROMPT_TITLES = {
    discours: "notation.scorecard.discours",
    methodo: "notation.scorecard.methodo",
    synthese: "notation.scorecard.synthese",
    transcription: "notation.scorecard.transcription",
} as const;

export type ScorecardNotationPromptTab = keyof typeof SCORECARD_NOTATION_PROMPT_TITLES;

export async function loadScorecardNotationPrompts(supabase: SupabaseClient) {
    const entries = Object.entries(SCORECARD_NOTATION_PROMPT_TITLES) as Array<
        [ScorecardNotationPromptTab, string]
    >;
    const { data, error } = await supabase
        .from("prompts")
        .select("title, prompt")
        .eq("is_active", true)
        .eq("status", PUBLISHED_CONTENT_STATUS)
        .in("title", entries.map(([, title]) => title));

    if (error) throw error;

    const promptsByTitle = new Map(
        ((data ?? []) as Array<Record<string, unknown>>)
            .filter((row) => typeof row.title === "string" && typeof row.prompt === "string")
            .map((row) => [row.title as string, row.prompt as string]),
    );

    const prompts = new Map<ScorecardNotationPromptTab, string>();
    for (const [tab, title] of entries) {
        const prompt = promptsByTitle.get(title);
        if (prompt) prompts.set(tab, prompt);
    }

    return prompts;
}
