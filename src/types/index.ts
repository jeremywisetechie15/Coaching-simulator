// ===========================================
// COACHING SIMULATOR - Type Definitions
// ===========================================

export interface Persona {
    id: string;
    name: string;
    voice_id: VoiceId;
    system_instructions: string;
    created_at?: string;
    updated_at?: string;
}

export interface Coach {
    id: string;
    name: string;
    voice_id: VoiceId;
    system_instructions: string;
    created_at?: string;
    updated_at?: string;
}

export interface Scenario {
    id: string;
    title: string;
    description: string | null;
    persona_id: string;
    persona?: Persona;
    created_at?: string;
    updated_at?: string;
}

export interface Session {
    id: string;
    scenario_id: string;
    duration_seconds?: number;
    status?: "active" | "completed" | "interrupted";
    created_at: string;
}

// OpenAI Realtime API Types
export type VoiceId = "alloy" | "ash" | "ballad" | "coral" | "echo" | "sage" | "shimmer" | "verse";

export interface RealtimeSessionConfig {
    model: string;
    voice: VoiceId;
    instructions: string;
    modalities?: ("text" | "audio")[];
    input_audio_format?: "pcm16" | "g711_ulaw" | "g711_alaw";
    output_audio_format?: "pcm16" | "g711_ulaw" | "g711_alaw";
    input_audio_transcription?: {
        model: string;
    };
    turn_detection?: {
        type: "server_vad";
        threshold?: number;
        prefix_padding_ms?: number;
        silence_duration_ms?: number;
        create_response?: boolean;
    };
}

export interface EphemeralKeyResponse {
    client_secret: {
        value: string;
        expires_at: number;
    };
}

// API Response Types
export interface ApiResponse<T> {
    data?: T;
    error?: string;
}

export interface RealtimeSessionResponse extends ApiResponse<EphemeralKeyResponse> {
    model: string;
    voice: VoiceId;
}
