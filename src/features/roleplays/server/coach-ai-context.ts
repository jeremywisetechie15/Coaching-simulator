import type { SupabaseClient } from "@supabase/supabase-js";
import {
    ROLEPLAY_COACH_MODE,
    ROLEPLAY_COACH_PROMPT_TITLE,
    type RoleplayCoachMode,
} from "@/features/roleplays/domain";
import { AppError } from "@/lib/server/errors";

interface CoachGlobalPromptRow {
    prompt: string;
}

export type RoleplayCoachPromptMode = RoleplayCoachMode | "default";

function cleanText(value: string | null | undefined) {
    return value?.trim() ?? "";
}

export async function loadRoleplayCoachGlobalPrompt(supabase: SupabaseClient) {
    const { data, error } = await supabase
        .from("prompts")
        .select("prompt")
        .eq("title", ROLEPLAY_COACH_PROMPT_TITLE.global)
        .eq("status", "published")
        .maybeSingle<CoachGlobalPromptRow>();

    if (error) throw error;

    const globalPrompt = cleanText(data?.prompt);
    if (!globalPrompt) {
        throw new AppError(
            `Le prompt global ${ROLEPLAY_COACH_PROMPT_TITLE.global} est introuvable ou non publié.`,
            500,
            "ROLEPLAY_COACH_GLOBAL_PROMPT_MISSING",
        );
    }

    return globalPrompt;
}

export async function resolveRoleplayCoachSessionPrompt(
    supabase: SupabaseClient,
    basePrompt: string,
    mode: RoleplayCoachPromptMode,
) {
    const cleanedBasePrompt = cleanText(basePrompt);

    if (mode === ROLEPLAY_COACH_MODE.feedback) {
        return cleanedBasePrompt;
    }

    const globalPrompt = await loadRoleplayCoachGlobalPrompt(supabase);

    return [
        `RÈGLES IA GLOBALES DES SESSIONS COACH:
---
${globalPrompt}
---`,
        cleanedBasePrompt,
    ]
        .filter(Boolean)
        .join("\n\n");
}
