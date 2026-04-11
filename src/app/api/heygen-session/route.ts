import { NextRequest, NextResponse } from "next/server";

const LIVEAVATAR_API = "https://api.liveavatar.com";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { systemInstructions, scenarioTitle } = body;

        const liveAvatarApiKey = process.env.LIVEAVATAR_API_KEY;
        const openaiApiKey = process.env.OPENAI_API_KEY;

        if (!liveAvatarApiKey) {
            return NextResponse.json(
                { error: "LIVEAVATAR_API_KEY not configured in .env.local" },
                { status: 500 }
            );
        }
        if (!openaiApiKey) {
            return NextResponse.json(
                { error: "OPENAI_API_KEY not configured in .env.local" },
                { status: 500 }
            );
        }

        const headers = {
            "X-API-KEY": liveAvatarApiKey,
            "Content-Type": "application/json",
        };

        // ─── Step 1: Use specified avatar ──────────────────────────────────────
        const avatarId = "073b60a9-89a8-45aa-8902-c358f64d2852";
        console.log("✅ Using avatar:", avatarId);

        // ─── Step 2: Register OpenAI API key as secret ────────────────────────
        const secretRes = await fetch(`${LIVEAVATAR_API}/v1/secrets`, {
            method: "POST",
            headers,
            body: JSON.stringify({
                secret_type: "OPENAI_API_KEY",
                secret_value: openaiApiKey,
                secret_name: `coaching-openai-${Date.now()}`,
            }),
        });

        if (!secretRes.ok) {
            const err = await secretRes.text();
            return NextResponse.json({ error: `Failed to register secret: ${err}` }, { status: secretRes.status });
        }

        const secretData = await secretRes.json();
        console.log("🔑 Secret response:", JSON.stringify(secretData));

        const secretId =
            secretData?.data?.id ||
            secretData?.data?.secret_id ||
            secretData?.id ||
            secretData?.secret_id;

        if (!secretId) {
            return NextResponse.json(
                { error: `No secret_id returned. Response: ${JSON.stringify(secretData)}` },
                { status: 500 }
            );
        }
        console.log("✅ Secret registered:", secretId);

        // ─── Step 3: Create LLM configuration ─────────────────────────────────
        // Note: endpoint uses kebab-case: /v1/llm-configurations
        const llmRes = await fetch(`${LIVEAVATAR_API}/v1/llm-configurations`, {
            method: "POST",
            headers,
            body: JSON.stringify({
                display_name: `Coach - ${(scenarioTitle || "Standard").slice(0, 50)}`,
                model_name: "gpt-4o-mini",
                secret_id: secretId,
                base_url: "https://api.openai.com",
            }),
        });

        if (!llmRes.ok) {
            const err = await llmRes.text();
            return NextResponse.json({ error: `Failed to create LLM config: ${err}` }, { status: llmRes.status });
        }

        const llmData = await llmRes.json();
        console.log("🤖 LLM config response:", JSON.stringify(llmData));

        const llmConfigId =
            llmData?.data?.id ||
            llmData?.data?.llm_configuration_id ||
            llmData?.id ||
            llmData?.llm_configuration_id;

        if (!llmConfigId) {
            return NextResponse.json(
                { error: `No llm_configuration_id returned. Response: ${JSON.stringify(llmData)}` },
                { status: 500 }
            );
        }
        console.log("✅ LLM config created:", llmConfigId);

        // ─── Step 4: Create Context (system prompt) ────────────────────────────
        const contextRes = await fetch(`${LIVEAVATAR_API}/v1/contexts`, {
            method: "POST",
            headers,
            body: JSON.stringify({
                name: `Coach - ${(scenarioTitle || "Standard").slice(0, 50)} - ${Date.now()}`,
                prompt: systemInstructions,
                opening_text: "Bonjour ! Je suis prêt à commencer notre session de coaching.",
            }),
        });

        if (!contextRes.ok) {
            const err = await contextRes.text();
            return NextResponse.json({ error: `Failed to create context: ${err}` }, { status: contextRes.status });
        }

        const contextData = await contextRes.json();
        console.log("📝 Context response:", JSON.stringify(contextData).slice(0, 200));

        const contextId =
            contextData?.data?.id ||
            contextData?.data?.context_id ||
            contextData?.id ||
            contextData?.context_id;

        if (!contextId) {
            return NextResponse.json(
                { error: `No context_id returned. Response: ${JSON.stringify(contextData)}` },
                { status: 500 }
            );
        }
        console.log("✅ Context created:", contextId);

        // ─── Step 5: Create Embed (avatar_id + context_id required) ───────────
        const embedRes = await fetch(`${LIVEAVATAR_API}/v2/embeddings`, {
            method: "POST",
            headers,
            body: JSON.stringify({
                avatar_id: avatarId,
                context_id: contextId,
                is_sandbox: false, // Custom avatar requires non-sandbox mode
            }),
        });

        if (!embedRes.ok) {
            const err = await embedRes.text();
            return NextResponse.json({ error: `Failed to create embed: ${err}` }, { status: embedRes.status });
        }

        const embedData = await embedRes.json();
        console.log("🎬 Embed response:", JSON.stringify(embedData));

        const embedUrl = embedData?.data?.url || embedData?.url;

        if (!embedUrl) {
            return NextResponse.json(
                { error: `No embed URL returned. Response: ${JSON.stringify(embedData)}` },
                { status: 500 }
            );
        }

        console.log("✅ Embed created:", embedUrl);

        return NextResponse.json({
            embedUrl,
            embedScript: embedData?.data?.script,
            avatarId,
            contextId,
            llmConfigId,
        });

    } catch (error) {
        console.error("Error creating HeyGen session:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Internal server error" },
            { status: 500 }
        );
    }
}
