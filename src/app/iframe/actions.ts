"use server";

import { createClient } from "@/lib/supabase/server";
import type { Persona, Coach } from "@/types";

export interface IframeSessionConfig {
    scenarioId: string;
    scenarioTitle: string;
    systemInstructions: string;
    voiceId: string;
    mode: "standard" | "coach";
    model: string;
    personaName: string;
    avatarUrl?: string;
}

interface PrepareParams {
    scenarioId?: string;
    mode?: string;
    refSessionId?: string;
    model?: string;
    coachId?: string;
}

// Step 1: Prepare session config (NO DB write) - called on page load
export async function prepareIframeSession(params: PrepareParams): Promise<{
    success: boolean;
    data?: IframeSessionConfig;
    error?: string
}> {
    const { scenarioId, mode = "standard", refSessionId, model = "gpt-realtime", coachId } = params;

    try {
        const supabase = await createClient();

        // COACH MODE: Get everything from session
        if (mode === "coach") {
            // Fetch coach from DB (coachId provided or fallback to DEFAULT_COACH_ID)
            let coach: Coach | null = null;
            const effectiveCoachId = coachId || process.env.DEFAULT_COACH_ID;

            if (effectiveCoachId) {
                const { data: coachData, error: coachError } = await supabase
                    .from("coaches")
                    .select("*")
                    .eq("id", effectiveCoachId)
                    .single<Coach>();

                if (coachError) {
                    console.error("Error fetching coach:", coachError);
                } else {
                    coach = coachData;
                }
            }

            if (!coach) {
                console.error("No coach found and DEFAULT_COACH_ID not set");
                return { success: false, error: "No coach available" };
            }

            // Determine the session ID to use (provided or latest)
            let effectiveSessionId = refSessionId;

            if (!effectiveSessionId) {
                // Fetch the latest completed session (any scenario)
                const { data: latestSession, error: sessionError } = await supabase
                    .from("sessions")
                    .select("id")
                    .eq("status", "completed")
                    .order("created_at", { ascending: false })
                    .limit(1)
                    .single();

                if (sessionError || !latestSession) {
                    console.error("Error fetching latest session:", sessionError);
                    return { success: false, error: "No completed session found" };
                }
                effectiveSessionId = latestSession.id;
                console.log("📝 Using latest session:", effectiveSessionId);
            }

            // Fetch the session with its scenario
            const { data: session, error: sessionFetchError } = await supabase
                .from("sessions")
                .select("*, scenarios(*, personas(*))")
                .eq("id", effectiveSessionId)
                .single();

            if (sessionFetchError || !session) {
                return { success: false, error: `Session not found: ${sessionFetchError?.message}` };
            }

            const scenario = session.scenarios as { id: string; title: string; description: string | null; personas: Persona };

            // Fetch session messages for transcript
            const { data: messages, error: messagesError } = await supabase
                .from("messages")
                .select("role, content, timestamp")
                .eq("session_id", effectiveSessionId)
                .order("timestamp", { ascending: true });

            let transcript = "Aucun transcript disponible.";
            if (!messagesError && messages && messages.length > 0) {
                transcript = messages
                    .map(m => `[${m.role === "user" ? "Utilisateur" : "Persona"}]: ${m.content}`)
                    .join("\n");
            }

            const systemInstructions = `${coach.system_instructions}

Voici le transcript complet de la session précédente pour t'aider à mieux à coacher l'utilisateur :
---
${transcript}
---
`;
            console.log("📝 Coach mode - Using coach:", coach.name);

            return {
                success: true,
                data: {
                    scenarioId: scenario.id,
                    scenarioTitle: scenario.title,
                    systemInstructions,
                    voiceId: coach.voice_id,
                    mode: "coach",
                    model,
                    personaName: coach.name,
                    avatarUrl: coach.avatar_url,
                },
            };
        }

        // STANDARD MODE: scenario_id is required
        if (!scenarioId) {
            return { success: false, error: "scenario_id is required for standard mode" };
        }

        // Fetch scenario with persona
        const { data: scenario, error: scenarioError } = await supabase
            .from("scenarios")
            .select("*, personas(*)")
            .eq("id", scenarioId)
            .single();

        if (scenarioError || !scenario) {
            return { success: false, error: `Scenario not found: ${scenarioError?.message}` };
        }

        const persona = scenario.personas as Persona;

        const systemInstructions = `
IMPORTANT: Dès que la conversation commence, tu dois immédiatement te présenter et saluer l'utilisateur en incarnant ton personnage. N'attends pas que l'utilisateur parle en premier. Commence la conversation de manière naturelle et engageante.

${persona.system_instructions}`;

        return {
            success: true,
            data: {
                scenarioId: scenario.id,
                scenarioTitle: scenario.title,
                systemInstructions,
                voiceId: persona.voice_id,
                mode: "standard",
                model,
                personaName: persona.name,
                avatarUrl: persona.avatar_url,
            },
        };

    } catch (error) {
        console.error("prepareIframeSession error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error"
        };
    }
}

// Step 2: Create session in DB - called when user clicks "Start"
export async function createIframeSession(scenarioId: string): Promise<{
    success: boolean;
    sessionId?: string;
    error?: string
}> {
    try {
        const supabase = await createClient();

        const { data: session, error: sessionError } = await supabase
            .from("sessions")
            .insert({
                scenario_id: scenarioId,
                status: "active",
                duration_seconds: 0,
            })
            .select()
            .single();

        if (sessionError || !session) {
            return { success: false, error: `Failed to create session: ${sessionError?.message}` };
        }

        return { success: true, sessionId: session.id };

    } catch (error) {
        console.error("createIframeSession error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error"
        };
    }
}

// Step 3: Complete session - called when user hangs up (if no messages to save via API)
export async function completeIframeSession(sessionId: string, durationSeconds: number): Promise<boolean> {
    try {
        const supabase = await createClient();

        const { error } = await supabase
            .from("sessions")
            .update({
                status: "completed",
                duration_seconds: durationSeconds
            })
            .eq("id", sessionId);

        return !error;
    } catch {
        return false;
    }
}
