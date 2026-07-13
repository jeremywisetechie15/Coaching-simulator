import type { SupabaseClient } from "@supabase/supabase-js";
import { PUBLISHED_CONTENT_STATUS } from "@/features/content/domain";

export const SCORECARD_NOTATION_TABS = ["methodo", "synthese"] as const;

export type ScorecardNotationPromptTab = (typeof SCORECARD_NOTATION_TABS)[number];

export const SCORECARD_NOTATION_PROMPT_TITLES: Record<ScorecardNotationPromptTab, string> = {
    methodo: "notation.scorecard.methodo",
    synthese: "notation.scorecard.synthese",
};

export async function loadScorecardNotationPrompts(supabase: SupabaseClient) {
    const entries = Object.entries(SCORECARD_NOTATION_PROMPT_TITLES) as Array<
        [ScorecardNotationPromptTab, string]
    >;
    const { data, error } = await supabase
        .from("prompts")
        .select("title, prompt")
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
