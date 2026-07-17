import type { SupabaseClient } from "@supabase/supabase-js";
import { AppError } from "@/lib/server/errors";

export const SCENARIO_GLOBAL_PROMPT_TITLE = "prompt.scenario.global";

interface ScenarioAiSettingsRow {
    ai_instructions: string;
}
interface ScenarioGlobalPromptRow {
    prompt: string;
}

export interface ScenarioAiContext {
    globalPrompt: string;
    scenarioInstructions: string;
}

function cleanText(value: string | null | undefined) {
    return value?.trim() ?? "";
}

export async function getScenarioAiInstructions(
    supabase: SupabaseClient,
    scenarioId: string,
) {
    const { data, error } = await supabase
        .from("scenario_ai_settings")
        .select("ai_instructions")
        .eq("scenario_id", scenarioId)
        .maybeSingle<ScenarioAiSettingsRow>();

    if (error) throw error;

    return cleanText(data?.ai_instructions);
}

export async function saveScenarioAiInstructions(
    supabase: SupabaseClient,
    scenarioId: string,
    aiInstructions: string,
) {
    const { error } = await supabase
        .from("scenario_ai_settings")
        .upsert(
            {
                ai_instructions: cleanText(aiInstructions),
                scenario_id: scenarioId,
            },
            { onConflict: "scenario_id" },
        );

    if (error) throw error;
}

export async function loadScenarioAiContext(
    supabase: SupabaseClient,
    scenarioId: string,
): Promise<ScenarioAiContext> {
    const [promptResult, scenarioInstructions] = await Promise.all([
        supabase
            .from("prompts")
            .select("prompt")
            .eq("title", SCENARIO_GLOBAL_PROMPT_TITLE)
            .eq("status", "published")
            .maybeSingle<ScenarioGlobalPromptRow>(),
        getScenarioAiInstructions(supabase, scenarioId),
    ]);

    if (promptResult.error) throw promptResult.error;

    const globalPrompt = cleanText(promptResult.data?.prompt);
    if (!globalPrompt) {
        throw new AppError(
            `Le prompt global ${SCENARIO_GLOBAL_PROMPT_TITLE} est introuvable ou non publié.`,
            500,
            "SCENARIO_GLOBAL_PROMPT_MISSING",
        );
    }

    return {
        globalPrompt,
        scenarioInstructions,
    };
}

export function composeRoleplayPersonaSimulationInstructions(
    baseInstructions: string,
    context: ScenarioAiContext,
) {
    const scenarioBlock = context.scenarioInstructions
        ? `INSTRUCTIONS IA SPÉCIFIQUES AU SCÉNARIO:
---
${context.scenarioInstructions}
---`
        : "";

    return [
        `RÈGLES IA GLOBALES DES SCÉNARIOS:
---
${context.globalPrompt}
---`,
        scenarioBlock,
        baseInstructions.trim(),
    ]
        .filter(Boolean)
        .join("\n\n");
}
