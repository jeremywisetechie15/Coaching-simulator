"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Persona, Coach } from "@/types";
import { MINIMUM_EVALUATED_ROLEPLAY_SESSION_DURATION_SECONDS } from "@/features/roleplays/domain";
import {
    getRoleplayCoachContext,
    serializeRoleplayCoachContext,
} from "@/features/roleplays/server/get-roleplay-coach-context";
import { getRoleplaySessionEvaluation } from "@/features/roleplays/server/get-roleplay-session-evaluation";
import { createSessionBackgroundSignedUrl } from "@/lib/uploads/session-background";

export interface IframeSessionConfig {
    scenarioId: string;
    scenarioTitle: string;
    systemInstructions: string;
    voiceId: string;
    mode: "standard" | "coach";
    coachMode?: "before_training" | "after_training" | "notation" | "default" | "persona_variant";
    model: string;
    personaName: string;
    avatarUrl?: string;
    backgroundUrl?: string;
}

interface PrepareParams {
    scenarioId?: string;
    mode?: string;
    refSessionId?: string;
    model?: string;
    coachId?: string;
    coachMode?: "before_training" | "after_training" | "notation";
    step?: number;
    variant?: "coach";
}

// =============================================
// PROMPTS - Maintenant stockés dans la table 'prompts' de la DB
// Titres: coach.before_training, coach.after_training
// =============================================

// Prompts de fallback si non trouvés en DB
const FALLBACK_BEFORE_TRAINING_PROMPT = `Tu es un coach professionnel qui prépare l'utilisateur AVANT une session d'entraînement.
Tu vas l'aider à se préparer mentalement et stratégiquement pour la simulation à venir.
Tu ne disposes PAS encore du transcript car la session n'a pas eu lieu.
Tu te concentres sur la préparation, les objectifs, et les techniques à utiliser.`;
const FALLBACK_AFTER_TRAINING_PROMPT = `Tu es un coach professionnel expert en débrief de sessions d'entraînement.
Tu analyses en détail la performance de l'utilisateur en te basant sur le transcript fourni.
Tu fournis un feedback structuré avec des points positifs et des axes d'amélioration.
Tu proposes des exercices et techniques pour progresser.`;

const FALLBACK_NOTATION_SYNTHESE_PROMPT = `Tu es LIA, coach professionnel bienveillante.
Tu vas discuter avec l'apprenant de ton appréciation globale de sa dernière session.
Tu te bases sur l'analyse détaillée qui a été faite pour lui donner un feedback constructif.
Tu restes dans un ton pédagogique, encourageant mais honnête.`;

const FALLBACK_PERSONA_VARIANT_FEEDBACK_PROMPT = `Après notre dernière conversation, tu donnes ton avis et ton ressenti émotionnel EN TANT QUE {{persona_name}} :
- Comment tu as perçu l'échange
- Ce que tu as apprécié dans l'approche de l'utilisateur
- Ce que tu n'as pas apprécié dans l'approche de l'utilisateur
- Ce qui aurait pu être fait différemment selon toi
- Tes conseils

Tu parles à la première personne en restant dans ton personnage ("j'ai trouvé que...", "Personnellement, je pense que...").`;

const COACH_CONTEXT_GUARDRAILS = `

RÈGLES DE CONTEXTE:
- Tu disposes déjà du contexte utile dans tes instructions système.
- Ne demande jamais à l'utilisateur de te redonner le contexte du scénario, le transcript, l'historique ou "ce qui s'est passé".
- Ne dis jamais que tu n'as pas le contexte si celui-ci est fourni ci-dessous.
- Si une information précise manque vraiment, pose uniquement une question ciblée sur ce point précis, sans demander un contexte global.
- Réponds directement comme si tu connaissais déjà la conversation et le scénario fournis.`;

const COACH_DYNAMIC_CONTEXT_PRIORITY = `

SOURCE DE VÉRITÉ DYNAMIQUE:
- Le bloc JSON "CONTEXTE DYNAMIQUE DU ROLEPLAY" ci-dessous est la source de vérité pour la méthode, le persona, le scénario et les étapes.
- Si le prompt générique contient un nom de méthode, de persona, d'entreprise ou d'étape différent, ignore cet exemple statique et utilise exclusivement le contexte dynamique.
- Les variables écrites sous la forme {{variable}} dans le prompt générique ne sont pas des données réelles. Utilise les valeurs du contexte dynamique à la place.`;

function buildAfterTrainingPerformanceContext(
    view: Awaited<ReturnType<typeof getRoleplaySessionEvaluation>>,
    selectedStepOrder?: number,
) {
    const evaluation = view.evaluation;

    if (selectedStepOrder) {
        return {
            progressAction:
                evaluation.planEtapes?.find((item) => item.number === selectedStepOrder) ?? null,
            selectedStep:
                evaluation.steps.find((item) => item.number === selectedStepOrder) ?? null,
            session: view.session,
        };
    }

    return {
        session: view.session,
        summary: {
            axesAmelioration: evaluation.axesAmelioration,
            coachAppreciation: evaluation.coachAppreciation,
            planEtapes: evaluation.planEtapes ?? [],
            pointsPositifs: evaluation.pointsPositifs,
            prioriteStrategique: evaluation.prioriteStrategique,
            scoreDetails: evaluation.scoreDetails ?? null,
        },
        steps: evaluation.steps,
    };
}

// Note: Les prompts sont stockés dans la table 'prompts' de la DB
// Titres: coach.before_training, coach.after_training, coach.notation.synthese, persona.variant.feedback
// Les descriptions des étapes sont maintenant stockées dans le champ coaching_steps de la table sessions

// Step 1: Prepare session config (NO DB write) - called on page load
export async function prepareIframeSession(params: PrepareParams): Promise<{
    success: boolean;
    data?: IframeSessionConfig;
    error?: string
}> {
    const {
        scenarioId,
        mode = "standard",
        refSessionId,
        model = "gpt-realtime-1.5",
        coachId,
        coachMode,
        step,
        variant
    } = params;

    try {
        const supabase = await createClient();
        const adminSupabase = createAdminClient();

        // =============================================
        // MODE COACH (mode=coach)
        // =============================================
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

            const coachBackgroundUrl = await createSessionBackgroundSignedUrl(
                adminSupabase,
                coach.background_image_path,
            );

            // =============================================
            // COACH MODE: before_training (Préparation AVANT session)
            // scenarioId is REQUIRED for this mode
            // =============================================
            if (coachMode === "before_training") {
                if (!scenarioId) {
                    return { success: false, error: "scenario_id is required for before_training mode" };
                }
                if (!step) {
                    return { success: false, error: "step is required for before_training mode" };
                }

                // Fetch prompt from DB
                const { data: promptData } = await adminSupabase
                    .from("prompts")
                    .select("prompt")
                    .eq("title", "coach.before_training")
                    .single();

                const basePrompt = promptData?.prompt || FALLBACK_BEFORE_TRAINING_PROMPT;

                const coachContext = await getRoleplayCoachContext(supabase, scenarioId, step);

                const systemInstructions = `${basePrompt}
${COACH_DYNAMIC_CONTEXT_PRIORITY}

CONTEXTE DYNAMIQUE DU ROLEPLAY:
${serializeRoleplayCoachContext(coachContext)}

${step ? `**IMPORTANT: concentre-toi exclusivement sur l'étape ${step}, décrite dans selectedStep.**` : ""}
${COACH_CONTEXT_GUARDRAILS}
`;

                console.log("📝 Coach mode: before_training, step:", step, "method steps:", coachContext.methodSteps.length);

                return {
                    success: true,
                    data: {
                        scenarioId: coachContext.scenario.id,
                        scenarioTitle: coachContext.scenario.title,
                        systemInstructions,
                        voiceId: coach.voice_id,
                        mode: "coach",
                        coachMode: "before_training",
                        model,
                        personaName: coach.name,
                        avatarUrl: coach.avatar_url,
                        backgroundUrl: coachBackgroundUrl,
                    },
                };
            }

            // =============================================
            // COACH MODE: after_training (Débrief APRÈS session avec transcript)
            // scenarioId is REQUIRED for this mode
            // =============================================
            if (coachMode === "after_training") {
                if (!scenarioId) {
                    return { success: false, error: "scenario_id is required for after_training mode" };
                }

                // Fetch prompt from DB
                const { data: promptData } = await adminSupabase
                    .from("prompts")
                    .select("prompt")
                    .eq("title", "coach.after_training")
                    .single();

                const basePrompt = promptData?.prompt || FALLBACK_AFTER_TRAINING_PROMPT;

                const coachContext = await getRoleplayCoachContext(supabase, scenarioId, step);
                const { data: { user } } = await supabase.auth.getUser();

                // Determine the session ID to use (provided or latest for this scenario)
                let sessionQuery = supabase
                    .from("sessions")
                    .select("id")
                    .eq("scenario_id", scenarioId)
                    .eq("status", "completed")
                    .gte("duration_seconds", MINIMUM_EVALUATED_ROLEPLAY_SESSION_DURATION_SECONDS);

                if (refSessionId) {
                    sessionQuery = sessionQuery.eq("id", refSessionId);
                } else {
                    sessionQuery = sessionQuery.order("created_at", { ascending: false }).limit(1);
                }
                if (user) {
                    sessionQuery = sessionQuery.eq("user_id", user.id);
                }

                const { data: session, error: sessionError } = await sessionQuery.maybeSingle<{ id: string }>();
                if (sessionError || !session) {
                    console.error("Error fetching roleplay session for coach:", sessionError);
                    return { success: false, error: "No eligible completed session found for this scenario" };
                }
                const effectiveSessionId = session.id;

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

                let performanceContext: unknown = null;
                if (user) {
                    try {
                        const evaluationView = await getRoleplaySessionEvaluation(effectiveSessionId, user.id);
                        performanceContext = buildAfterTrainingPerformanceContext(evaluationView, step);
                    } catch (evaluationError) {
                        console.error("Unable to build after-training evaluation context:", evaluationError);
                    }
                }

                const systemInstructions = `${basePrompt}
${COACH_DYNAMIC_CONTEXT_PRIORITY}

CONTEXTE DYNAMIQUE DU ROLEPLAY:
${serializeRoleplayCoachContext(coachContext)}

CONTEXTE D'ÉVALUATION DE LA SESSION:
${performanceContext ? JSON.stringify(performanceContext, null, 2) : "Aucune analyse structurée disponible."}

${step ? `**IMPORTANT: concentre-toi exclusivement sur l'étape ${step}, son analyse et ses critères.**` : ""}
Voici le transcript complet de la session à analyser:
---
${transcript}
---
${COACH_CONTEXT_GUARDRAILS}
`;

                console.log("📝 Coach mode: after_training, step:", step, "session:", effectiveSessionId, "method steps:", coachContext.methodSteps.length, transcript ? "transcript found" : "transcript not found");

                return {
                    success: true,
                    data: {
                        scenarioId: coachContext.scenario.id,
                        scenarioTitle: coachContext.scenario.title,
                        systemInstructions,
                        voiceId: coach.voice_id,
                        mode: "coach",
                        coachMode: "after_training",
                        model,
                        personaName: coach.name,
                        avatarUrl: coach.avatar_url,
                        backgroundUrl: coachBackgroundUrl,
                    },
                };
            }

            // =============================================
            // COACH MODE: notation (Synthèse de la notation - appréciation globale)
            // scenarioId is REQUIRED for this mode
            // =============================================
            if (coachMode === "notation") {
                if (!scenarioId) {
                    return { success: false, error: "scenario_id is required for notation mode" };
                }

                // Fetch prompt from DB
                const { data: promptData } = await adminSupabase
                    .from("prompts")
                    .select("prompt")
                    .eq("title", "coach.notation.synthese")
                    .single();

                const basePrompt = promptData?.prompt || FALLBACK_NOTATION_SYNTHESE_PROMPT;

                // Fetch scenario
                const { data: scenario, error: scenarioError } = await supabase
                    .from("scenarios")
                    .select("id, title, description")
                    .eq("id", scenarioId)
                    .single();

                if (scenarioError || !scenario) {
                    return { success: false, error: `Scenario not found: ${scenarioError?.message}` };
                }

                // Fetch the latest completed session with notation_json FOR THIS SCENARIO
                const { data: latestSession, error: sessionError } = await supabase
                    .from("sessions")
                    .select("id, notation_json")
                    .eq("scenario_id", scenarioId)
                    .eq("status", "completed")
                    .not("notation_json", "is", null)
                    .order("created_at", { ascending: false })
                    .limit(1)
                    .single();

                if (sessionError || !latestSession) {
                    console.error("Error fetching latest session with notation:", sessionError);
                    return { success: false, error: "No completed session with notation found for this scenario" };
                }

                const effectiveSessionId = latestSession.id;
                const notationJson = latestSession.notation_json as Record<string, unknown> | null;

                // Extract appreciation_globale.texte from synthese
                let appreciationGlobaleTexte = "Aucune appréciation globale disponible.";
                if (notationJson && typeof notationJson === "object") {
                    const synthese = notationJson.synthese as Record<string, unknown> | undefined;
                    if (synthese && typeof synthese === "object") {
                        const appreciationGlobale = synthese.appreciation_globale as Record<string, unknown> | undefined;
                        if (appreciationGlobale && typeof appreciationGlobale.texte === "string") {
                            appreciationGlobaleTexte = appreciationGlobale.texte;
                        }
                    }
                }

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

                const systemInstructions = `${basePrompt}

Contexte du scénario évalué:
- Titre : ${scenario.title}
- Description : ${scenario.description || "Aucune description disponible"}

Ton appréciation globale de la session (c'est ce dont tu dois parler avec l'apprenant):
---
${appreciationGlobaleTexte}
---

Pour contexte, voici le transcript de la session analysée:
---
${transcript}
---

IMPORTANT: Commence par partager ton appréciation globale avec l'apprenant. Sois bienveillante mais honnête. 
Parle à la première personne ("J'ai remarqué que...", "De mon analyse...", "Ce que j'ai apprécié...").
${COACH_CONTEXT_GUARDRAILS}
`;

                console.log("📝 Coach mode: notation, session:", effectiveSessionId, "appreciation extracted:", appreciationGlobaleTexte ? "yes" : "no");

                return {
                    success: true,
                    data: {
                        scenarioId: scenario.id,
                        scenarioTitle: scenario.title,
                        systemInstructions,
                        voiceId: coach.voice_id,
                        mode: "coach",
                        coachMode: "notation",
                        model,
                        personaName: coach.name,
                        avatarUrl: coach.avatar_url,
                        backgroundUrl: coachBackgroundUrl,
                    },
                };
            }

            // =============================================
            // COACH MODE: Par défaut (comportement actuel - débrief avec transcript)
            // =============================================
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

Contexte du scénario sur lequel l'utilisateur s'est entraîné :
- Titre : ${scenario.title}
- Description : ${scenario.description || "Aucune description disponible"}

commence par présenter le titre du scénario, 
Voici le transcript complet de la session précédente pour t'aider à mieux coacher l'utilisateur :
---
${transcript}
---
${COACH_CONTEXT_GUARDRAILS}
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
                    coachMode: "default",
                    model,
                    personaName: coach.name,
                    avatarUrl: coach.avatar_url,
                    backgroundUrl: coachBackgroundUrl,
                },
            };
        }

        // =============================================
        // MODE PERSONA avec VARIANT=COACH
        // Le PERSONA donne son avis sur la dernière session
        // (UI standard, voix/avatar du persona)
        // =============================================
        if (variant === "coach" && scenarioId) {
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
            const roleplayBackgroundUrl = await createSessionBackgroundSignedUrl(
                adminSupabase,
                scenario.background_image_path,
            );

            // Fetch latest completed session for this scenario
            const { data: latestSession } = await supabase
                .from("sessions")
                .select("id")
                .eq("scenario_id", scenarioId)
                .eq("status", "completed")
                .order("created_at", { ascending: false })
                .limit(1)
                .single();

            let transcript = "Aucune session précédente disponible pour ce scénario.";

            if (latestSession) {
                const { data: messages, error: messagesError } = await supabase
                    .from("messages")
                    .select("role, content, timestamp")
                    .eq("session_id", latestSession.id)
                    .order("timestamp", { ascending: true });

                if (!messagesError && messages && messages.length > 0) {
                    transcript = messages
                        .map(m => `[${m.role === "user" ? "Utilisateur" : "Toi (${persona.name})"}]: ${m.content}`)
                        .join("\n");
                }
            }

            // Fetch prompt from DB
            const { data: variantPromptData } = await adminSupabase
                .from("prompts")
                .select("prompt")
                .eq("title", "persona.variant.feedback")
                .single();

            const variantBasePrompt = (variantPromptData?.prompt || FALLBACK_PERSONA_VARIANT_FEEDBACK_PROMPT)

            // Le persona reste dans son rôle et donne son avis
            const systemInstructions = `Tu es ${persona.name}. Tu restes dans ton personnage.

${variantBasePrompt}

${persona.system_instructions || ""}

Contexte du scénario:
- Titre : ${scenario.title}
- Description : ${scenario.description || "Aucune description disponible"}

Voici le transcript de notre dernière conversation:
---
${transcript}
---
`;

            console.log("📝 Persona variant mode - Persona gives feedback:", persona.name, "transcript:", transcript);

            return {
                success: true,
                data: {
                    scenarioId: scenario.id,
                    scenarioTitle: scenario.title,
                    systemInstructions,
                    voiceId: persona.voice_id,
                    mode: "standard", // Use persona UI (not coach UI)
                    coachMode: "persona_variant",
                    model,
                    personaName: persona.name,
                    avatarUrl: persona.avatar_url,
                    backgroundUrl: roleplayBackgroundUrl,
                },
            };
        }

        // =============================================
        // MODE STANDARD (Persona) - comportement par défaut
        // =============================================
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
        const roleplayBackgroundUrl = await createSessionBackgroundSignedUrl(
            adminSupabase,
            scenario.background_image_path,
        );

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
                backgroundUrl: roleplayBackgroundUrl,
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
        const {
            data: { user },
        } = await supabase.auth.getUser();

        const { data: session, error: sessionError } = await supabase
            .from("sessions")
            .insert({
                scenario_id: scenarioId,
                status: "active",
                duration_seconds: 0,
                user_id: user?.id ?? null,
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
        const {
            data: { user },
        } = await supabase.auth.getUser();
        const updatePayload = {
            status: "completed",
            duration_seconds: durationSeconds,
            ...(user?.id ? { user_id: user.id } : {}),
        };

        const { error } = await supabase
            .from("sessions")
            .update(updatePayload)
            .eq("id", sessionId);

        return !error;
    } catch {
        return false;
    }
}
