import { describe, expect, it } from "vitest";
import { CONTENT_STATUS } from "@/features/content/domain";
import { saveScorecardDto, type SaveScorecardInput } from "./save-scorecard.dto";

const methodId = "11111111-1111-4111-8111-111111111111";
const methodStepId = "22222222-2222-4222-8222-222222222222";
const organizationId = "33333333-3333-4333-8333-333333333333";
const dimensionItemId = "44444444-4444-4444-8444-444444444444";

function publishedScorecard(overrides: Partial<SaveScorecardInput> = {}): SaveScorecardInput {
    return {
        category: "Prospection",
        description: "Scorecard de notation.",
        domain: "Commercial",
        level: "Intermédiaire",
        methodId,
        name: "Scorecard DAGO",
        status: CONTENT_STATUS.published,
        steps: [
            {
                criteria: [
                    {
                        competenceId: "acces-decideur",
                        dimension: "savoir_faire",
                        dimensionItemId,
                        expectedEvidence: "Demande courte, claire et orientée action.",
                        key: "Formuler la demande de mise en relation",
                        maxPoints: 4,
                        order: 1,
                        verbatim: "Pouvez-vous me le passer ?",
                    },
                ],
                methodStepId,
                name: "Accrocher",
                order: 1,
                weightPercent: 100,
            },
        ],
        visibility: "public",
        ...overrides,
    };
}

describe("saveScorecardDto", () => {
    it("accepts a minimal draft linked to a method", () => {
        const result = saveScorecardDto.parse({
            methodId,
            name: "Scorecard brouillon",
        });

        expect(result.status).toBe(CONTENT_STATUS.draft);
        expect(result.steps).toEqual([]);
        expect(result.visibility).toBe("public");
    });

    it("requires an organization for private scorecards", () => {
        const result = saveScorecardDto.safeParse({
            methodId,
            name: "Scorecard privée",
            visibility: "private",
        });

        expect(result.success).toBe(false);
        expect(result.error?.issues.map((issue) => issue.message)).toContain(
            "Une scorecard privée doit être liée à une organisation.",
        );
    });

    it("accepts a complete published private scorecard", () => {
        const result = saveScorecardDto.parse(
            publishedScorecard({
                organizationId,
                visibility: "private",
            }),
        );

        expect(result.organizationId).toBe(organizationId);
        expect(result.steps[0].criteria[0].dimensionItemId).toBe(dimensionItemId);
    });

    it("requires a dimension item id for criteria", () => {
        const result = saveScorecardDto.safeParse(
            publishedScorecard({
                steps: [
                    {
                        ...publishedScorecard().steps![0],
                        criteria: [
                            {
                                ...publishedScorecard().steps![0].criteria![0],
                                dimensionItemId: null,
                            },
                        ],
                    },
                ],
            }),
        );

        expect(result.success).toBe(false);
        expect(result.error?.issues.map((issue) => issue.path.join("."))).toContain(
            "steps.0.criteria.0.dimensionItemId",
        );
    });

    it("rejects knowledge-only dimensions for scorecard criteria", () => {
        const result = saveScorecardDto.safeParse(
            publishedScorecard({
                steps: [
                    {
                        ...publishedScorecard().steps![0],
                        criteria: [
                            {
                                ...publishedScorecard().steps![0].criteria![0],
                                dimension: "savoir" as never,
                            },
                        ],
                    },
                ],
            }),
        );

        expect(result.success).toBe(false);
        expect(result.error?.issues.map((issue) => issue.path.join("."))).toContain(
            "steps.0.criteria.0.dimension",
        );
    });

    it("requires a conforming verbatim example for criteria", () => {
        const result = saveScorecardDto.safeParse(
            publishedScorecard({
                steps: [
                    {
                        ...publishedScorecard().steps![0],
                        criteria: [
                            {
                                ...publishedScorecard().steps![0].criteria![0],
                                verbatim: " ",
                            },
                        ],
                    },
                ],
            }),
        );

        expect(result.success).toBe(false);
        expect(result.error?.issues.map((issue) => issue.path.join("."))).toContain(
            "steps.0.criteria.0.verbatim",
        );
    });

    it("rejects a zero step weight", () => {
        const result = saveScorecardDto.safeParse(
            publishedScorecard({
                steps: [{ ...publishedScorecard().steps![0], weightPercent: 0 }],
            }),
        );

        expect(result.success).toBe(false);
        expect(result.error?.issues.map((issue) => issue.path.join("."))).toContain(
            "steps.0.weightPercent",
        );
    });

    it("requires published step weights to total 100 percent", () => {
        const result = saveScorecardDto.safeParse(
            publishedScorecard({
                steps: [{ ...publishedScorecard().steps![0], weightPercent: 80 }],
            }),
        );

        expect(result.success).toBe(false);
        expect(result.error?.issues.map((issue) => issue.message)).toContain(
            "La pondération des étapes doit totaliser 100%.",
        );
    });
});
