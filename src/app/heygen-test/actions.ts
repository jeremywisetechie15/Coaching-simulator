"use server";

import { createClient } from "@/lib/supabase/server";
import type { Coach } from "@/types";

const FALLBACK_COACH_PROMPT = `Tu es un coach professionnel expert en communication et techniques de vente.
Tu analyses la performance de l'utilisateur et fournis un feedback constructif, bienveillant et actionnable.
Tu parles à la première personne, en restant dans ton rôle de coach professionnel.`;

export interface HeygenTestConfig {
    systemInstructions: string;
    scenarioTitle: string;
    coachName: string;
}

interface PrepareParams {
    scenarioId?: string;
    mode?: string;
    coachMode?: "before_training" | "after_training" | "notation";
}

export async function prepareHeygenTestSession(params: PrepareParams = {}): Promise<{
    success: boolean;
    data?: HeygenTestConfig;
    error?: string;
}> {
    try {
        const { scenarioId, coachMode = "after_training" } = params;
        const supabase = await createClient();

        // 1. Fetch the default coach
        const defaultCoachId = process.env.DEFAULT_COACH_ID;
        let coach: Coach | null = null;

        if (defaultCoachId) {
            const { data: coachData } = await supabase
                .from("coaches")
                .select("*")
                .eq("id", defaultCoachId)
                .single<Coach>();
            coach = coachData;
        }

        if (!coach) {
            const { data: anyCoach } = await supabase
                .from("coaches")
                .select("*")
                .limit(1)
                .single<Coach>();
            coach = anyCoach;
        }

        // 2. Find the relevant session — by scenarioId if provided, otherwise latest
        let sessionQuery = supabase
            .from("sessions")
            .select("id, scenario_id")
            .eq("status", "completed")
            .order("created_at", { ascending: false })
            .limit(1);

        if (scenarioId) {
            sessionQuery = sessionQuery.eq("scenario_id", scenarioId);
        }

        const { data: latestSession } = await sessionQuery.single();

        let scenarioTitle = "Session de coaching";
        let transcript = "Aucun transcript disponible.";

        if (latestSession) {
            const { data: scenario } = await supabase
                .from("scenarios")
                .select("title")
                .eq("id", latestSession.scenario_id)
                .single();

            if (scenario) scenarioTitle = scenario.title;

            const { data: messages } = await supabase
                .from("messages")
                .select("role, content")
                .eq("session_id", latestSession.id)
                .order("timestamp", { ascending: true });

            if (messages && messages.length > 0) {
                transcript = messages
                    .map(m => `[${m.role === "user" ? "Utilisateur" : "Persona"}]: ${m.content}`)
                    .join("\n");
            }
        }

        // 3. Pick prompt based on coachMode
        const promptTitle = coachMode === "before_training"
            ? "coach.before_training"
            : "coach.after_training";

        const { data: promptData } = await supabase
            .from("prompts")
            .select("prompt")
            .eq("title", promptTitle)
            .single();

        const basePrompt = promptData?.prompt || (coach?.system_instructions || FALLBACK_COACH_PROMPT);

        // Truncate transcript to avoid LiveAvatar context size limits (~3000 chars max for prompt)
        const MAX_TRANSCRIPT_CHARS = 2000;
        const truncatedTranscript = transcript.length > MAX_TRANSCRIPT_CHARS
            ? transcript.slice(0, MAX_TRANSCRIPT_CHARS) + "\n[...transcript tronqué pour la démo]"
            : transcript;

        // Keep the base prompt concise for LiveAvatar
        const shortBasePrompt = basePrompt.slice(0, 800);

        const systemInstructions = `${shortBasePrompt}

Scénario: ${scenarioTitle}

Transcript de la session:
---
${truncatedTranscript}
---

Commence par saluer l'utilisateur et partage ton appréciation de sa session. Sois bienveillant et constructif.`;

        return {
            success: true,
            data: {
                systemInstructions,
                scenarioTitle,
                coachName: coach?.name || "Coach IA",
            },
        };

    } catch (error) {
        console.error("prepareHeygenTestSession error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}
