import { beforeEach, describe, expect, it, vi } from "vitest";
import { CONTENT_STATUS } from "@/features/content/domain";
import { saveRoleplayDto, type SaveRoleplayInput } from "@/features/roleplays/dto";

const mocks = vi.hoisted(() => ({
    assertRoleplayLifecycle: vi.fn(),
    assertRoleplayQuizzesMatchMethod: vi.fn(),
    assertRoleplaySessionEditPolicy: vi.fn(),
    assertScorecardMatchesMethod: vi.fn(),
    fetchRoleplayDetail: vi.fn(),
    materializeScenarioResourceUploads: vi.fn(),
    resolveNotationMethodId: vi.fn(),
    rpc: vi.fn(),
}));

vi.mock("@/features/auth/server", () => ({
    requireAdmin: vi.fn().mockResolvedValue({ userId: "admin-1" }),
}));
vi.mock("@/lib/supabase/admin", () => ({
    createAdminClient: () => ({
        from: (table: string) => {
            const query = {
                eq: () => query,
                maybeSingle: vi.fn().mockResolvedValue({
                    data: table === "scenarios"
                        ? { background_image_path: null, status: CONTENT_STATUS.published }
                        : null,
                    error: null,
                }),
                returns: vi.fn().mockResolvedValue({ data: [], error: null }),
                select: () => query,
            };
            return query;
        },
        rpc: mocks.rpc,
    }),
}));
vi.mock("./assert-roleplay-lifecycle", () => ({
    assertRoleplayLifecycle: mocks.assertRoleplayLifecycle,
}));
vi.mock("./create-roleplay", () => ({
    assertScorecardMatchesMethod: mocks.assertScorecardMatchesMethod,
    resolveNotationMethodId: mocks.resolveNotationMethodId,
}));
vi.mock("./roleplay-query", () => ({
    fetchRoleplayDetail: mocks.fetchRoleplayDetail,
}));
vi.mock("./roleplay-quiz-assignment.validation", () => ({
    assertRoleplayQuizzesMatchMethod: mocks.assertRoleplayQuizzesMatchMethod,
}));
vi.mock("./roleplay-session-edit-policy", () => ({
    assertRoleplaySessionEditPolicy: mocks.assertRoleplaySessionEditPolicy,
}));
vi.mock("./roleplay-upload-files", async (importOriginal) => {
    const original = await importOriginal<typeof import("./roleplay-upload-files")>();
    return {
        ...original,
        materializeScenarioResourceUploads: mocks.materializeScenarioResourceUploads,
    };
});

import { updateRoleplay } from "./update-roleplay";

function publishedRoleplayInput(overrides: Partial<SaveRoleplayInput> = {}) {
    return saveRoleplayDto.parse({
        category: "Prise de rendez-vous",
        coachId: "11111111-1111-4111-8111-111111111111",
        difficulty: "Moyen",
        domain: "Commerce et développement commercial",
        learnerRole: "Vous incarnez le conseiller commercial.",
        methodId: "22222222-2222-4222-8222-222222222222",
        personaId: "33333333-3333-4333-8333-333333333333",
        scorecardId: "44444444-4444-4444-8444-444444444444",
        status: CONTENT_STATUS.published,
        title: "Roleplay publié",
        ...overrides,
    });
}

describe("updateRoleplay", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.fetchRoleplayDetail.mockResolvedValue({ id: "roleplay-1" });
        mocks.materializeScenarioResourceUploads.mockImplementation(
            async (_client, _roleplayId, input) => input,
        );
        mocks.resolveNotationMethodId.mockResolvedValue(null);
        mocks.rpc.mockResolvedValue({ error: null });
    });

    it("persists new AI instructions on a published roleplay after the session policy passes", async () => {
        const input = publishedRoleplayInput({
            aiInstructions: "Conserve l’objection jusqu’à une question ouverte.",
        });

        await updateRoleplay("roleplay-1", input);

        expect(mocks.assertRoleplaySessionEditPolicy).toHaveBeenCalledWith(
            expect.anything(),
            "roleplay-1",
            input,
            { hasResourceUploads: false },
        );
        expect(mocks.rpc).toHaveBeenCalledWith(
            "admin_update_roleplay_aggregate",
            expect.objectContaining({
                p_ai_instructions: "Conserve l’objection jusqu’à une question ouverte.",
                p_roleplay_id: "roleplay-1",
            }),
        );
    });

    it("persists complementary quiz participation and order after the session policy passes", async () => {
        const input = publishedRoleplayInput({
            quizIds: [
                "55555555-5555-4555-8555-555555555555",
                "66666666-6666-4666-8666-666666666666",
            ],
            quizParticipation: "mandatory",
        });

        await updateRoleplay("roleplay-1", input);

        expect(mocks.rpc).toHaveBeenCalledWith(
            "admin_update_roleplay_aggregate",
            expect.objectContaining({
                p_quizzes: [
                    {
                        participation: "mandatory",
                        quiz_id: "55555555-5555-4555-8555-555555555555",
                        scenario_id: "roleplay-1",
                        sort_order: 1,
                    },
                    {
                        participation: "mandatory",
                        quiz_id: "66666666-6666-4666-8666-666666666666",
                        scenario_id: "roleplay-1",
                        sort_order: 2,
                    },
                ],
            }),
        );
    });
});
