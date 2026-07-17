import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError, UnauthorizedError } from "@/lib/server/errors";

const mocks = vi.hoisted(() => ({
    buildRoleplayPersonaSimulationInstructions: vi.fn(),
    createAdminClient: vi.fn(),
    createClient: vi.fn(),
    fetch: vi.fn(),
    getRoleplayPersonaContext: vi.fn(),
    loadScenarioAiContext: vi.fn(),
    requireAuth: vi.fn(),
}));

vi.mock("@/features/auth/server", () => ({
    requireAuth: mocks.requireAuth,
}));

vi.mock("@/lib/supabase/admin", () => ({
    createAdminClient: mocks.createAdminClient,
}));

vi.mock("@/lib/supabase/server", () => ({
    createClient: mocks.createClient,
}));

vi.mock("@/features/roleplays/server/get-roleplay-coach-context", () => ({
    buildRoleplayPersonaSimulationInstructions: mocks.buildRoleplayPersonaSimulationInstructions,
    getRoleplayPersonaContext: mocks.getRoleplayPersonaContext,
}));

vi.mock("@/features/roleplays/server/scenario-ai-context", async (importOriginal) => {
    const actual = await importOriginal<typeof import("@/features/roleplays/server/scenario-ai-context")>();

    return {
        ...actual,
        loadScenarioAiContext: mocks.loadScenarioAiContext,
    };
});

import { POST } from "./route";

const scenarioId = "11111111-1111-4111-8111-111111111111";

function request(body: Record<string, unknown>) {
    return new NextRequest("http://localhost/api/realtime-session", {
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
        method: "POST",
    });
}

describe("POST /api/realtime-session", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubGlobal("fetch", mocks.fetch);
        process.env.OPENAI_API_KEY = "test-openai-key";
        mocks.createClient.mockResolvedValue({ kind: "authenticated-client" });
        mocks.createAdminClient.mockReturnValue({ kind: "admin-client" });
        mocks.getRoleplayPersonaContext.mockResolvedValue({
            persona: {
                voiceId: "alloy",
            },
        });
        mocks.buildRoleplayPersonaSimulationInstructions.mockReturnValue(
            "INSTRUCTIONS SYSTÈME DU PERSONA:\nContexte existant.",
        );
        mocks.loadScenarioAiContext.mockResolvedValue({
            globalPrompt: "Règle globale unique.",
            scenarioInstructions: "Instruction scénario privée.",
        });
        mocks.requireAuth.mockResolvedValue({ userId: "user-1" });
        mocks.fetch.mockResolvedValue(
            new Response(JSON.stringify({ expires_at: 123456, value: "ephemeral-key" }), {
                status: 200,
            }),
        );
    });

    it("rejects an invalid scenario identifier before calling OpenAI", async () => {
        const response = await POST(request({ scenario_id: "not-a-uuid" }));
        const payload = await response.json();

        expect(response.status).toBe(400);
        expect(payload.code).toBe("VALIDATION_ERROR");
        expect(mocks.fetch).not.toHaveBeenCalled();
    });

    it("requires authentication for client-prepared system instructions", async () => {
        mocks.requireAuth.mockRejectedValue(new UnauthorizedError());

        const response = await POST(request({ system_instructions: "Prompt client" }));
        const payload = await response.json();

        expect(response.status).toBe(401);
        expect(payload.code).toBe("UNAUTHORIZED");
        expect(mocks.fetch).not.toHaveBeenCalled();
    });

    it("builds scenario instructions on the server and ignores a client override", async () => {
        const response = await POST(request({
            model: "gpt-realtime-1.5",
            scenario_id: scenarioId,
            system_instructions: "CLIENT OVERRIDE",
        }));
        const payload = await response.json();

        expect(response.status).toBe(200);
        expect(mocks.getRoleplayPersonaContext).toHaveBeenCalledWith(
            { kind: "authenticated-client" },
            scenarioId,
        );
        expect(mocks.getRoleplayPersonaContext.mock.invocationCallOrder[0]).toBeLessThan(
            mocks.loadScenarioAiContext.mock.invocationCallOrder[0],
        );
        expect(mocks.loadScenarioAiContext).toHaveBeenCalledWith(
            { kind: "admin-client" },
            scenarioId,
        );

        const openAiRequest = mocks.fetch.mock.calls[0]?.[1] as RequestInit;
        const openAiBody = JSON.parse(String(openAiRequest.body));
        const instructions = openAiBody.session.instructions as string;

        expect(instructions).toContain("Contexte existant.");
        expect(instructions.match(/Règle globale unique\./g)).toHaveLength(1);
        expect(instructions.match(/Instruction scénario privée\./g)).toHaveLength(1);
        expect(instructions).not.toContain("CLIENT OVERRIDE");
        expect(JSON.stringify(payload)).not.toContain("Instruction scénario privée.");
        expect(payload.data.client_secret.value).toBe("ephemeral-key");
    });

    it("does not call OpenAI when the global scenario prompt is unavailable", async () => {
        mocks.loadScenarioAiContext.mockRejectedValue(
            new AppError("Prompt global manquant.", 500, "SCENARIO_GLOBAL_PROMPT_MISSING"),
        );

        const response = await POST(request({ scenario_id: scenarioId }));
        const payload = await response.json();

        expect(response.status).toBe(500);
        expect(payload.code).toBe("SCENARIO_GLOBAL_PROMPT_MISSING");
        expect(mocks.fetch).not.toHaveBeenCalled();
    });
});
