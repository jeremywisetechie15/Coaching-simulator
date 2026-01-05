"use server";

import { createClient } from "@/lib/supabase/server";
import type { Persona } from "@/types";

export interface IframeSessionConfig {
    scenarioId: string;
    scenarioTitle: string;
    systemInstructions: string;
    voiceId: string;
    mode: "standard" | "coach";
    model: string;
    personaName: string;
}

interface PrepareParams {
    scenarioId: string;
    mode?: string;
    refSessionId?: string;
    model?: string;
}

// Step 1: Prepare session config (NO DB write) - called on page load
export async function prepareIframeSession(params: PrepareParams): Promise<{
    success: boolean;
    data?: IframeSessionConfig;
    error?: string
}> {
    const { scenarioId, mode = "standard", refSessionId, model = "gpt-realtime" } = params;

    if (!scenarioId) {
        return { success: false, error: "scenario_id is required" };
    }

    try {
        const supabase = await createClient();

        // 1. Fetch scenario
        const { data: scenario, error: scenarioError } = await supabase
            .from("scenarios")
            .select("*, personas(*)")
            .eq("id", scenarioId)
            .single();

        if (scenarioError || !scenario) {
            return { success: false, error: `Scenario not found: ${scenarioError?.message}` };
        }

        const persona = scenario.personas as Persona;
        let systemInstructions: string;
        let voiceId: string;

        // 2. Generate system prompt based on mode
        if (mode === "coach" && refSessionId) {
            // Coach mode: Fetch previous session messages
            const { data: messages, error: messagesError } = await supabase
                .from("messages")
                .select("role, content, timestamp")
                .eq("session_id", refSessionId)
                .order("timestamp", { ascending: true });

            if (messagesError) {
                console.error("Error fetching messages:", messagesError);
            }

            // Format transcript
            const transcript = messages
                ?.map(m => `[${m.role === "user" ? "Utilisateur" : "Persona"}]: ${m.content}`)
                .join("\n") || "Aucun transcript disponible.";

            systemInstructions = `Tu es un Coach professionnel bienveillant et constructif.

L'utilisateur a joué le scénario de coaching suivant : "${scenario.title}"
Description du scénario : ${scenario.description}

Voici le transcript complet de sa session précédente :
---
${transcript}
---

Ton rôle est d'analyser cette conversation et de débriefer avec l'utilisateur :
1. Commence par le féliciter pour avoir fait l'exercice
2. Identifie 2-3 points forts dans sa communication
3. Identifie 1-2 axes d'amélioration avec des suggestions concrètes
4. Propose des alternatives de formulation si nécessaire
5. Réponds à ses questions sur sa performance

Sois encourageant, précis et actionnable. Parle en français de manière naturelle et conversationnelle.`;

            voiceId = "alloy"; // Voix neutre pour le coach
        } else {
            // Standard mode: Use persona instructions with auto-start greeting
            systemInstructions = `${persona.system_instructions}

IMPORTANT: Dès que la conversation commence, tu dois immédiatement te présenter et saluer l'utilisateur en incarnant ton personnage. N'attends pas que l'utilisateur parle en premier. Commence la conversation de manière naturelle et engageante.`;
            voiceId = persona.voice_id;
        }

        // Return config WITHOUT creating session
        return {
            success: true,
            data: {
                scenarioId: scenario.id,
                scenarioTitle: scenario.title,
                systemInstructions,
                voiceId,
                mode: mode as "standard" | "coach",
                model,
                personaName: mode === "coach" ? "Pierre Laurent" : persona.name,
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
