import { describe, expect, it } from "vitest";
import { CONTENT_STATUS } from "@/features/content/domain";
import { saveScorecardDto } from "@/features/scorecards/dto";
import { mapScorecardRowsToDetail } from "./scorecard.mapper";
import {
    createScorecardCriterionRows,
    createScorecardInsert,
    createScorecardStepRows,
    createScorecardUpdate,
} from "./scorecard.persistence";

const methodId = "11111111-1111-4111-8111-111111111111";
const methodStepId = "22222222-2222-4222-8222-222222222222";
const organizationId = "33333333-3333-4333-8333-333333333333";
const dimensionItemId = "44444444-4444-4444-8444-444444444444";

describe("scorecard persistence helpers", () => {
    it("maps a save DTO to scorecard, step and criterion rows", () => {
        const input = saveScorecardDto.parse({
            category: "Prospection",
            description: "Scorecard de notation.",
            domain: "Commercial",
            level: "Intermédiaire",
            methodId,
            name: "Scorecard DAGO",
            organizationId,
            status: CONTENT_STATUS.published,
            steps: [
                {
                    criteria: [
                        {
                            aiInstruction: "Évaluer la clarté de la demande.",
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
                },
            ],
            visibility: "private",
        });

        expect(createScorecardInsert(input, "55555555-5555-4555-8555-555555555555")).toMatchObject({
            method_id: methodId,
            name: "Scorecard DAGO",
            organization_id: organizationId,
            status: CONTENT_STATUS.published,
            visibility_scope: "organization",
        });

        const stepRows = createScorecardStepRows("scorecard-1", input);
        expect(stepRows).toEqual([
            {
                method_step_id: methodStepId,
                name: "Accrocher",
                scorecard_id: "scorecard-1",
                step_order: 1,
            },
        ]);

        const criterionRows = createScorecardCriterionRows(
            input,
            new Map([[methodStepId, "scorecard-step-1"]]),
        );
        expect(criterionRows).toEqual([
            {
                ai_instruction: "Évaluer la clarté de la demande.",
                criterion_key: "Formuler la demande de mise en relation",
                criterion_order: 1,
                dimension: "savoir_faire",
                dimension_item_id: dimensionItemId,
                expected_evidence: "Demande courte, claire et orientée action.",
                max_points: 4,
                scorecard_step_id: "scorecard-step-1",
                skill_id: "acces-decideur",
                verbatim: "Pouvez-vous me le passer ?",
            },
        ]);
    });

    it("marks archived scorecard updates inactive", () => {
        const input = saveScorecardDto.parse({
            methodId,
            name: "Scorecard archivée",
            status: CONTENT_STATUS.archived,
        });

        expect(createScorecardUpdate(input)).toMatchObject({
            is_active: false,
            status: CONTENT_STATUS.archived,
        });
    });

    it("maps public scorecard updates without keeping the previous organization target", () => {
        const input = saveScorecardDto.parse({
            methodId,
            name: "Scorecard publique",
            organizationId,
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
                        },
                    ],
                    methodStepId,
                    name: "Accrocher",
                    order: 1,
                },
            ],
            visibility: "public",
        });

        expect(createScorecardUpdate(input)).toMatchObject({
            method_id: methodId,
            organization_id: null,
            status: CONTENT_STATUS.published,
            visibility_scope: "public",
        });
        expect(
            createScorecardCriterionRows(input, new Map([[methodStepId, "scorecard-step-1"]])),
        ).toEqual([
            expect.objectContaining({
                dimension: "savoir_faire",
                dimension_item_id: dimensionItemId,
                scorecard_step_id: "scorecard-step-1",
                skill_id: "acces-decideur",
            }),
        ]);
    });
});

describe("scorecard mapper", () => {
    it("builds a detail with ordered steps and criteria", () => {
        const detail = mapScorecardRowsToDetail(
            {
                category: "Prospection",
                id: "scorecard-1",
                method_id: methodId,
                name: "Scorecard DAGO",
                status: CONTENT_STATUS.published,
                visibility_scope: "organization",
            },
            [
                {
                    id: "step-2",
                    method_step_id: "method-step-2",
                    name: "Découvrir",
                    scorecard_id: "scorecard-1",
                    step_order: 2,
                },
                {
                    id: "step-1",
                    method_step_id: methodStepId,
                    name: "Accrocher",
                    scorecard_id: "scorecard-1",
                    step_order: 1,
                },
            ],
            [
                {
                    criterion_key: "Critère 2",
                    criterion_order: 2,
                    dimension: "savoir_etre",
                    dimension_item_id: dimensionItemId,
                    expected_evidence: "Preuve 2",
                    id: "criterion-2",
                    max_points: 2,
                    scorecard_step_id: "step-1",
                    skill_id: "posture-persuasive",
                },
                {
                    criterion_key: "Critère 1",
                    criterion_order: 1,
                    dimension: "savoir_faire",
                    dimension_item_id: dimensionItemId,
                    expected_evidence: "Preuve 1",
                    id: "criterion-1",
                    max_points: 4,
                    scorecard_step_id: "step-1",
                    skill_id: "acces-decideur",
                },
            ],
            "DAGO",
        );

        expect(detail.methodName).toBe("DAGO");
        expect(detail.stepCount).toBe(2);
        expect(detail.criteriaCount).toBe(2);
        expect(detail.visibility).toBe("private");
        expect(detail.steps.map((step) => step.name)).toEqual(["Accrocher", "Découvrir"]);
        expect(detail.steps[0].criteria.map((criterion) => criterion.key)).toEqual(["Critère 1", "Critère 2"]);
    });
});
