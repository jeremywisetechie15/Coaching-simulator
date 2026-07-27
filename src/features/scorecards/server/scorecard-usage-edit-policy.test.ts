import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ScorecardDetail } from "@/features/scorecards/domain";
import { SCORECARD_USAGE_EDIT_RESTRICTION_MESSAGE } from "@/features/scorecards/domain";
import type { SaveScorecardDto } from "@/features/scorecards/dto";

const mocks = vi.hoisted(() => ({
    fetchScorecardDetail: vi.fn(),
    hasRoleplaySessionsForScenarioDependency: vi.fn(),
}));

vi.mock("@/features/content/server", () => ({
    hasRoleplaySessionsForScenarioDependency:
        mocks.hasRoleplaySessionsForScenarioDependency,
}));
vi.mock("./scorecard-query", () => ({
    fetchScorecardDetail: mocks.fetchScorecardDetail,
}));

import { assertScorecardUsageEditPolicy } from "./scorecard-usage-edit-policy";

class FakeCountQuery implements PromiseLike<{
    count: number;
    data: null;
    error: null;
}> {
    constructor(private readonly count: number) {}

    select() {
        return this;
    }

    eq() {
        return this;
    }

    then<TResult1 = {
        count: number;
        data: null;
        error: null;
    }, TResult2 = never>(
        onfulfilled?: ((value: {
            count: number;
            data: null;
            error: null;
        }) => TResult1 | PromiseLike<TResult1>) | null,
        onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
    ): PromiseLike<TResult1 | TResult2> {
        return Promise.resolve({
            count: this.count,
            data: null,
            error: null,
        } as const).then(onfulfilled, onrejected);
    }
}

function createFakeSupabase(hasResults: boolean) {
    return {
        from: () => new FakeCountQuery(hasResults ? 1 : 0),
    };
}

const scorecardId = "11111111-1111-4111-8111-111111111111";
const methodId = "22222222-2222-4222-8222-222222222222";
const methodStepId = "33333333-3333-4333-8333-333333333333";
const scorecardStepId = "44444444-4444-4444-8444-444444444444";
const criterionId = "55555555-5555-4555-8555-555555555555";
const dimensionItemId = "66666666-6666-4666-8666-666666666666";

function currentScorecard(): ScorecardDetail {
    return {
        category: "Prospection",
        createdAt: null,
        criteriaCount: 1,
        description: "Description initiale",
        domain: "Commercial",
        id: scorecardId,
        level: "Intermédiaire",
        methodId,
        methodName: "Méthode DAGO",
        name: "Scorecard initiale",
        organizationId: null,
        status: "published",
        stepCount: 1,
        steps: [{
            criteria: [{
                aiInstruction: "Consigne initiale",
                competenceId: "competence-1",
                dimension: "savoir_faire",
                dimensionItemId,
                expectedEvidence: "Preuve initiale",
                id: criterionId,
                key: "Critère initial",
                maxPoints: 4,
                order: 1,
                verbatim: "Verbatim initial",
            }],
            id: scorecardStepId,
            methodStepId,
            name: "Étape initiale",
            order: 1,
            weightPercent: 100,
        }],
        visibility: "public",
    };
}

function unchangedInput(): SaveScorecardDto {
    return {
        category: "Prospection",
        description: "Description initiale",
        domain: "Commercial",
        level: "Intermédiaire",
        methodId,
        name: "Scorecard initiale",
        organizationId: null,
        status: "published",
        steps: [{
            criteria: [{
                aiInstruction: "Consigne initiale",
                competenceId: "competence-1",
                dimension: "savoir_faire",
                dimensionItemId,
                expectedEvidence: "Preuve initiale",
                id: criterionId,
                key: "Critère initial",
                maxPoints: 4,
                order: 1,
                verbatim: "Verbatim initial",
            }],
            id: scorecardStepId,
            methodStepId,
            name: "Étape initiale",
            order: 1,
            weightPercent: 100,
        }],
        visibility: "public",
    };
}

describe("scorecard usage edit policy server guard", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.fetchScorecardDetail.mockResolvedValue(currentScorecard());
        mocks.hasRoleplaySessionsForScenarioDependency.mockResolvedValue(false);
    });

    it("allows existing text and numeric values to change after usage", async () => {
        const input = unchangedInput();
        input.name = "Scorecard renommée";
        input.description = "Description modifiée";
        input.steps[0]!.name = "Étape renommée";
        input.steps[0]!.weightPercent = 80;
        input.steps[0]!.criteria[0]!.key = "Critère reformulé";
        input.steps[0]!.criteria[0]!.expectedEvidence = "Preuve reformulée";
        input.steps[0]!.criteria[0]!.aiInstruction = "Nouvelle consigne";
        input.steps[0]!.criteria[0]!.verbatim = "Nouveau verbatim";
        input.steps[0]!.criteria[0]!.order = 2;
        input.steps[0]!.criteria[0]!.maxPoints = 5;

        await expect(
            assertScorecardUsageEditPolicy(
                createFakeSupabase(true) as never,
                scorecardId,
                input,
            ),
        ).resolves.toBeUndefined();
    });

    it("rejects selections and criteria structure changes after usage", async () => {
        const input = unchangedInput();
        input.methodId = "77777777-7777-4777-8777-777777777777";
        input.steps[0]!.criteria = [];

        await expect(
            assertScorecardUsageEditPolicy(
                createFakeSupabase(true) as never,
                scorecardId,
                input,
            ),
        ).rejects.toMatchObject({
            message: SCORECARD_USAGE_EDIT_RESTRICTION_MESSAGE,
            status: 409,
        });
    });

    it("allows structural changes before the first usage", async () => {
        const input = unchangedInput();
        input.steps = [];

        await expect(
            assertScorecardUsageEditPolicy(
                createFakeSupabase(false) as never,
                scorecardId,
                input,
            ),
        ).resolves.toBeUndefined();
        expect(mocks.fetchScorecardDetail).not.toHaveBeenCalled();
    });
});
