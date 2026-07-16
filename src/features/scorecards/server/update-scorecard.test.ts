import { beforeEach, describe, expect, it, vi } from "vitest";
import { CONTENT_STATUS } from "@/features/content/domain";
import type { SaveScorecardDto } from "@/features/scorecards/dto";

const mocks = vi.hoisted(() => ({
    assertScorecardLifecycle: vi.fn(),
    fetchScorecardDetail: vi.fn(),
    rpc: vi.fn(),
}));

vi.mock("@/features/auth/server", () => ({ requireAdmin: vi.fn().mockResolvedValue({ userId: "admin-1" }) }));
vi.mock("@/lib/supabase/admin", () => ({
    createAdminClient: () => ({
        from: () => {
            const query = {
                eq: () => query,
                maybeSingle: vi.fn().mockResolvedValue({
                    data: { status: CONTENT_STATUS.draft },
                    error: null,
                }),
                select: () => query,
            };
            return query;
        },
        rpc: mocks.rpc,
    }),
}));
vi.mock("./assert-scorecard-lifecycle", () => ({
    assertScorecardLifecycle: mocks.assertScorecardLifecycle,
}));
vi.mock("./scorecard-query", () => ({ fetchScorecardDetail: mocks.fetchScorecardDetail }));

import { updateScorecard } from "./update-scorecard";

const methodId = "11111111-1111-4111-8111-111111111111";
const methodStepId = "22222222-2222-4222-8222-222222222222";
const scorecardStepId = "33333333-3333-4333-8333-333333333333";
const criterionId = "44444444-4444-4444-8444-444444444444";
const dimensionItemId = "55555555-5555-4555-8555-555555555555";

function scorecardInput(): SaveScorecardDto {
    return {
        category: "Prospection",
        description: "Description",
        domain: "Commercial",
        level: "Intermédiaire",
        methodId,
        name: "Scorecard",
        organizationId: null,
        status: CONTENT_STATUS.draft,
        steps: [{
            criteria: [{
                aiInstruction: "",
                competenceId: "skill-1",
                dimension: "savoir_faire",
                dimensionItemId,
                expectedEvidence: "Preuve",
                id: criterionId,
                key: "Critère",
                maxPoints: 4,
                order: 1,
                verbatim: "Exemple",
            }],
            id: scorecardStepId,
            methodStepId,
            name: "Étape",
            order: 1,
            weightPercent: 100,
        }],
        visibility: "public",
    };
}

describe("updateScorecard", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.rpc.mockResolvedValue({ error: null });
        mocks.fetchScorecardDetail.mockResolvedValue({ id: "scorecard-1" });
    });

    it("preserves existing step and criterion IDs", async () => {
        await updateScorecard("scorecard-1", scorecardInput());

        expect(mocks.rpc).toHaveBeenCalledWith("admin_update_scorecard_aggregate", expect.objectContaining({
            p_criteria: [expect.objectContaining({ id: criterionId, scorecard_step_id: scorecardStepId })],
            p_steps: [expect.objectContaining({ id: scorecardStepId })],
        }));
    });
});
