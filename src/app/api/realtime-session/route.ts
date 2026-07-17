import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { VoiceId, Persona } from "@/types";
import { DEFAULT_OPENAI_REALTIME_VOICE_ID, isOpenAIRealtimeVoiceId } from "@/lib/openai/realtime-voices";
import {
    buildRoleplayPersonaSimulationInstructions,
    getRoleplayPersonaContext,
} from "@/features/roleplays/server/get-roleplay-coach-context";
import {
    composeRoleplayPersonaSimulationInstructions,
    loadScenarioAiContext,
} from "@/features/roleplays/server/scenario-ai-context";
import { jsonError } from "@/lib/server/http";
import { requireAuth } from "@/features/auth/server";

const OPENAI_REALTIME_CLIENT_SECRETS_URL = "https://api.openai.com/v1/realtime/client_secrets";


const DEFAULT_MODEL = "gpt-realtime-1.5";
const VALID_MODELS = [
    "gpt-4o-mini-realtime-preview",
    "gpt-4o-realtime-preview",
    "gpt-realtime",
    "gpt-realtime-1.5",
    "gpt-realtime-mini",
    "gpt-realtime-2",
];
const scenarioIdDto = z.string().uuid("L'identifiant du scénario est invalide.");

interface RequestBody {
    persona_id?: string;
    scenario_id?: string;
    system_instructions?: string;
    voice?: string;
    model?: string;
}

interface RealtimeClientSecretResponse {
    expires_at: number;
    session?: unknown;
    value: string;
}

export async function POST(request: NextRequest) {
    try {
        const body: RequestBody = await request.json();
        const { persona_id, scenario_id, system_instructions, voice, model } = body;

        if (!scenario_id && !persona_id && !system_instructions) {
            return NextResponse.json(
                { error: "scenario_id, persona_id or system_instructions is required" },
                { status: 400 },
            );
        }

        if (scenario_id) {
            scenarioIdDto.parse(scenario_id);
        } else {
            await requireAuth();
        }

        let instructions = system_instructions || "";
        let voiceId: VoiceId = DEFAULT_OPENAI_REALTIME_VOICE_ID;

        if (voice) {
            if (!isOpenAIRealtimeVoiceId(voice)) {
                return NextResponse.json({ error: "Unsupported realtime voice" }, { status: 400 });
            }

            voiceId = voice;
        }


        const selectedModel = model && VALID_MODELS.includes(model) ? model : DEFAULT_MODEL;


        if (scenario_id) {
            const supabase = await createClient();
            const roleplayContext = await getRoleplayPersonaContext(supabase, scenario_id);
            const persona = roleplayContext.persona;

            if (!persona) {
                return NextResponse.json({ error: "Persona not found for this scenario" }, { status: 404 });
            }

            const scenarioAiContext = await loadScenarioAiContext(createAdminClient(), scenario_id);
            instructions = composeRoleplayPersonaSimulationInstructions(
                buildRoleplayPersonaSimulationInstructions(roleplayContext),
                scenarioAiContext,
            );

            if (!voice) {
                const personaVoiceId = persona.voiceId;
                if (!personaVoiceId || !isOpenAIRealtimeVoiceId(personaVoiceId)) {
                    return NextResponse.json(
                        { error: "Persona voice is not supported by the realtime service" },
                        { status: 500 },
                    );
                }

                voiceId = personaVoiceId;
            }
        } else if (persona_id) {
            const supabase = await createClient();
            const { data: persona, error: dbError } = await supabase
                .from("personas")
                .select("*")
                .eq("id", persona_id)
                .single<Persona>();

            if (dbError || !persona) {
                return NextResponse.json(
                    { error: `Persona not found: ${dbError?.message || "Unknown error"}` },
                    { status: 404 }
                );
            }

            instructions = persona.system_instructions;

            if (!voice) {
                if (!isOpenAIRealtimeVoiceId(persona.voice_id)) {
                    return NextResponse.json(
                        { error: "Persona voice is not supported by the realtime service" },
                        { status: 500 }
                    );
                }

                voiceId = persona.voice_id;
            }
        }


        const openaiApiKey = process.env.OPENAI_API_KEY;
        if (!openaiApiKey) {
            return NextResponse.json(
                { error: "Voice service is not configured" },
                { status: 500 }
            );
        }




        const openaiResponse = await fetch(OPENAI_REALTIME_CLIENT_SECRETS_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${openaiApiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                expires_after: {
                    anchor: "created_at",
                    seconds: 600,
                },
                session: {
                    type: "realtime",
                    model: selectedModel,
                    instructions,
                    output_modalities: ["audio"],
                    max_output_tokens: 4096,
                    audio: {
                        input: {
                            transcription: {
                                model: "whisper-1",
                            },
                            turn_detection: {
                                type: "server_vad",
                                threshold: 0.8,
                                prefix_padding_ms: 300,
                                silence_duration_ms: 600,
                                create_response: true,
                            },
                        },
                        output: {
                            voice: voiceId,
                        },
                    },
                },
            }),
        });

        if (!openaiResponse.ok) {
            const errorText = await openaiResponse.text();
            console.error("OpenAI API Error:", errorText);
            return NextResponse.json(
                { error: `OpenAI API error: ${openaiResponse.status} - ${errorText}` },
                { status: openaiResponse.status }
            );
        }

        const clientSecretData = await openaiResponse.json() as RealtimeClientSecretResponse;


        return NextResponse.json({
            data: {
                client_secret: {
                    value: clientSecretData.value,
                    expires_at: clientSecretData.expires_at,
                },
            },
            model: selectedModel,
            voice: voiceId,
        });

    } catch (error) {
        return jsonError(error);
    }
}
