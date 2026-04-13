import { NextRequest, NextResponse } from "next/server";

const LIVEAVATAR_API = "https://api.liveavatar.com";
const DEFAULT_COACH_AVATAR_ID = "d1b25f7e-ef00-455b-af2f-62c84254924a";
const LIVEAVATAR_SUCCESS_CODE = 1000;
const DEFAULT_LLM_MODEL = "gpt-4.1";

interface CoachHeygenSessionRequest {
    systemInstructions?: string;
    scenarioTitle?: string;
    coachMode?: "before_training" | "after_training" | "notation" | "default" | "persona_variant";
    model?: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null;

const getResponseData = <T>(payload: unknown): T => {
    if (isRecord(payload) && "data" in payload && payload.data !== undefined) {
        return payload.data as T;
    }

    return payload as T;
};

const normalizeModel = (model?: string): string => {
    if (!model) {
        return DEFAULT_LLM_MODEL;
    }

    if (model.includes("realtime")) {
        return DEFAULT_LLM_MODEL;
    }

    return model;
};

const cleanEnv = (value?: string | null): string | undefined => {
    const trimmed = value?.trim();
    return trimmed ? trimmed : undefined;
};

const buildOpeningText = (coachMode?: CoachHeygenSessionRequest["coachMode"]): string => {
    switch (coachMode) {
        case "before_training":
            return "Bonjour, préparons ensemble votre prochaine session.";
        case "after_training":
            return "Bonjour, analysons ensemble votre dernière session.";
        case "notation":
            return "Bonjour, je vais vous partager mon appréciation globale de votre session.";
        default:
            return "Bonjour, je suis prête à commencer cette session de coaching.";
    }
};

const extractErrorMessage = (payload: unknown, fallback: string): string => {
    if (isRecord(payload) && typeof payload.message === "string" && payload.message.trim()) {
        return payload.message;
    }

    return fallback;
};

async function liveAvatarRequest<T>(
    path: string,
    init: RequestInit,
    fallbackMessage: string,
): Promise<T> {
    const response = await fetch(`${LIVEAVATAR_API}${path}`, init);
    const rawBody = await response.text();

    let payload: unknown = null;
    if (rawBody) {
        try {
            payload = JSON.parse(rawBody);
        } catch {
            payload = rawBody;
        }
    }

    if (!response.ok) {
        const message = extractErrorMessage(payload, rawBody || fallbackMessage);
        throw new Error(message);
    }

    if (isRecord(payload) && typeof payload.code === "number" && payload.code !== LIVEAVATAR_SUCCESS_CODE) {
        throw new Error(extractErrorMessage(payload, fallbackMessage));
    }

    return getResponseData<T>(payload);
}

async function createLlmConfiguration(
    headers: HeadersInit,
    body: string,
): Promise<{ id?: string; llm_configuration_id?: string }> {
    try {
        return await liveAvatarRequest<{ id?: string; llm_configuration_id?: string }>(
            "/v1/llm-configurations",
            {
                method: "POST",
                headers,
                body,
            },
            "Failed to create LLM configuration",
        );
    } catch (error) {
        const message = error instanceof Error ? error.message : "";
        const shouldRetryWithLegacyPath = message.includes("404") || message.includes("Not Found");

        if (!shouldRetryWithLegacyPath) {
            throw error;
        }

        return liveAvatarRequest<{ id?: string; llm_configuration_id?: string }>(
            "/v1/llm_configurations",
            {
                method: "POST",
                headers,
                body,
            },
            "Failed to create LLM configuration",
        );
    }
}

async function createElevenLabsVoice(
    headers: HeadersInit,
    elevenLabsApiKey: string,
    providerVoiceId: string,
): Promise<string | null> {
    const secret = await liveAvatarRequest<{ id?: string; secret_id?: string }>(
        "/v1/secrets",
        {
            method: "POST",
            headers,
            body: JSON.stringify({
                secret_type: "ELEVENLABS_API_KEY",
                secret_value: elevenLabsApiKey,
                secret_name: `coach-elevenlabs-${Date.now()}`,
            }),
        },
        "Failed to register ElevenLabs secret",
    );

    const secretId = secret.id || secret.secret_id;

    if (!secretId) {
        throw new Error("No ElevenLabs secret_id returned by LiveAvatar");
    }

    const voice = await liveAvatarRequest<{ id?: string; voice_id?: string }>(
        "/v1/voices/third_party",
        {
            method: "POST",
            headers,
            body: JSON.stringify({
                secret_id: secretId,
                provider_voice_id: providerVoiceId,
            }),
        },
        "Failed to bind ElevenLabs voice",
    );

    return voice.id || voice.voice_id || null;
}

export async function POST(request: NextRequest) {
    try {
        const body = (await request.json()) as CoachHeygenSessionRequest;
        const { systemInstructions, scenarioTitle, coachMode, model } = body;

        if (!systemInstructions?.trim()) {
            return NextResponse.json(
                { error: "systemInstructions is required" },
                { status: 400 },
            );
        }

        const liveAvatarApiKey = cleanEnv(process.env.LIVEAVATAR_API_KEY);
        const openaiApiKey = cleanEnv(process.env.OPENAI_API_KEY);
        const shouldUseImportedVoice = cleanEnv(process.env.LIVEAVATAR_ENABLE_IMPORTED_VOICE) === "true";
        const importedElevenLabsVoiceId = shouldUseImportedVoice
            ? cleanEnv(
                process.env.LIVEAVATAR_IMPORTED_ELEVENLABS_VOICE_ID ||
                process.env.LIVEAVATAR_ELEVENLABS_IMPORTED_VOICE_ID,
            )
            : undefined;
        const elevenLabsApiKey = shouldUseImportedVoice
            ? cleanEnv(process.env.ELEVENLABS_API_KEY)
            : undefined;
        const elevenLabsProviderVoiceId = shouldUseImportedVoice
            ? cleanEnv(
                process.env.LIVEAVATAR_ELEVENLABS_VOICE_ID ||
                process.env.ELEVENLABS_PROVIDER_VOICE_ID ||
                process.env.ELEVENLABS_VOICE_ID,
            )
            : undefined;
        const coachAvatarId = cleanEnv(process.env.LIVEAVATAR_COACH_AVATAR_ID) || DEFAULT_COACH_AVATAR_ID;

        if (!liveAvatarApiKey) {
            return NextResponse.json(
                { error: "LIVEAVATAR_API_KEY not configured in environment" },
                { status: 500 },
            );
        }

        if (!openaiApiKey) {
            return NextResponse.json(
                { error: "OPENAI_API_KEY not configured in environment" },
                { status: 500 },
            );
        }

        const headers = {
            "X-API-KEY": liveAvatarApiKey,
            "Content-Type": "application/json",
        };

        const normalizedModel = normalizeModel(model);
        let liveAvatarVoiceId: string | null = importedElevenLabsVoiceId || null;

        if (liveAvatarVoiceId) {
            console.log("✅ Using pre-imported ElevenLabs LiveAvatar voice");
        } else if (elevenLabsApiKey && elevenLabsProviderVoiceId) {
            try {
                liveAvatarVoiceId = await createElevenLabsVoice(
                    headers,
                    elevenLabsApiKey,
                    elevenLabsProviderVoiceId,
                );
                console.log("✅ ElevenLabs voice bound dynamically for coach session");
            } catch (voiceError) {
                console.error("⚠️ ElevenLabs voice binding failed, falling back to default voice:", voiceError);
            }
        }

        const secret = await liveAvatarRequest<{ id?: string; secret_id?: string }>(
            "/v1/secrets",
            {
                method: "POST",
                headers,
                body: JSON.stringify({
                    secret_type: "OPENAI_API_KEY",
                    secret_value: openaiApiKey,
                    secret_name: `coach-openai-${Date.now()}`,
                }),
            },
            "Failed to register LLM secret",
        );

        const secretId = secret.id || secret.secret_id;

        if (!secretId) {
            throw new Error("No secret_id returned by LiveAvatar");
        }

        const llmConfiguration = await createLlmConfiguration(
            headers,
            JSON.stringify({
                display_name: `Coach ${String(scenarioTitle || "Session").slice(0, 50)}`,
                model_name: normalizedModel,
                secret_id: secretId,
                url: "https://api.openai.com/v1/chat/completions",
            }),
        );

        const llmConfigurationId = llmConfiguration.id || llmConfiguration.llm_configuration_id;

        if (!llmConfigurationId) {
            throw new Error("No llm_configuration_id returned by LiveAvatar");
        }

        const context = await liveAvatarRequest<{ id?: string; context_id?: string }>(
            "/v1/contexts",
            {
                method: "POST",
                headers,
                body: JSON.stringify({
                    name: `Coach ${String(scenarioTitle || "Session").slice(0, 50)} ${Date.now()}`,
                    prompt: systemInstructions,
                    opening_text: buildOpeningText(coachMode),
                }),
            },
            "Failed to create context",
        );

        const contextId = context.id || context.context_id;

        if (!contextId) {
            throw new Error("No context_id returned by LiveAvatar");
        }

        const sessionToken = await liveAvatarRequest<{ session_token?: string; session_id?: string }>(
            "/v1/sessions/token",
            {
                method: "POST",
                headers,
                body: JSON.stringify({
                    mode: "FULL",
                    avatar_id: coachAvatarId,
                    llm_configuration_id: llmConfigurationId,
                    avatar_persona: {
                        ...(liveAvatarVoiceId ? { voice_id: liveAvatarVoiceId } : {}),
                        context_id: contextId,
                        language: "fr",
                    },
                }),
            },
            "Failed to create session token",
        );

        if (!sessionToken.session_token) {
            throw new Error("No session_token returned by LiveAvatar");
        }

        return NextResponse.json({
            sessionToken: sessionToken.session_token,
            sessionId: sessionToken.session_id,
            avatarId: coachAvatarId,
            contextId,
            llmConfigurationId,
            model: normalizedModel,
        });
    } catch (error) {
        console.error("Error creating coach HeyGen session:", error);

        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Internal server error" },
            { status: 500 },
        );
    }
}
