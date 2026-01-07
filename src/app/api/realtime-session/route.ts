import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { VoiceId, RealtimeSessionResponse, Persona } from "@/types";

// OpenAI Realtime API endpoint for ephemeral key generation
const OPENAI_REALTIME_SESSIONS_URL = "https://api.openai.com/v1/realtime/sessions";

// Model configuration - default model
const DEFAULT_MODEL = "gpt-realtime";
const VALID_MODELS = [
    "gpt-4o-mini-realtime-preview",
    "gpt-4o-realtime-preview",
    "gpt-realtime",
    "gpt-realtime-mini"
];

interface RequestBody {
    persona_id?: string;
    system_instructions?: string;
    voice?: VoiceId;
    model?: string;
}

export async function POST(request: NextRequest) {
    try {
        const body: RequestBody = await request.json();
        const { persona_id, system_instructions, voice, model } = body;

        // Validate that we have either persona_id or system_instructions
        if (!persona_id && !system_instructions) {
            return NextResponse.json(
                { error: "Either persona_id or system_instructions is required" },
                { status: 400 }
            );
        }

        let instructions = system_instructions || "";
        let voiceId: VoiceId = voice || "alloy";

        // Validate and set model
        const selectedModel = model && VALID_MODELS.includes(model) ? model : DEFAULT_MODEL;

        // If persona_id is provided, fetch persona from Supabase
        if (persona_id) {
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
            // Use voice from request body if provided, otherwise use persona's voice
            if (!voice) {
                voiceId = persona.voice_id;
            }
        }

        // Check for OpenAI API key
        const openaiApiKey = process.env.OPENAI_API_KEY;
        if (!openaiApiKey) {
            return NextResponse.json(
                { error: "OpenAI API key not configured" },
                { status: 500 }
            );
        }



        // Request ephemeral key from OpenAI
        const openaiResponse = await fetch(OPENAI_REALTIME_SESSIONS_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${openaiApiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: selectedModel,
                voice: voiceId,
                instructions: instructions,
                modalities: ["audio", "text"],
                input_audio_format: "pcm16",
                output_audio_format: "pcm16",
                input_audio_transcription: {
                    model: "whisper-1",
                },
                turn_detection: {
                    type: "server_vad",
                    threshold: 0.5,
                    prefix_padding_ms: 300,
                    silence_duration_ms: 500,
                    create_response: true,
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

        const sessionData = await openaiResponse.json();

        // Return the ephemeral key to the client
        return NextResponse.json({
            data: {
                client_secret: sessionData.client_secret,
            },
            model: selectedModel,
            voice: voiceId,
        });

    } catch (error) {
        console.error("Error creating realtime session:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Internal server error" },
            { status: 500 }
        );
    }
}
