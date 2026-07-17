import { describe, expect, it } from "vitest";
import type { RoleplayNotationStepRef } from "@/features/roleplays/domain";
import { normalizeScorecardNotationSynthesis } from "./scorecard-notation-synthesis";

const steps: RoleplayNotationStepRef[] = [
    {
        code: "ENGAGE",
        methodStepId: "method-step-1",
        order: 1,
        ref: "S1",
        scorecardStepId: "scorecard-step-1",
        title: "Engager la conversation",
        weightPercent: 40,
    },
    {
        code: "EXPLORE",
        methodStepId: "method-step-2",
        order: 2,
        ref: "S2",
        scorecardStepId: "scorecard-step-2",
        title: "Explorer le besoin",
        weightPercent: 60,
    },
];

describe("scorecard notation synthesis", () => {
    it("resolves generic step refs without depending on method letters", () => {
        const normalized = normalizeScorecardNotationSynthesis({
            moments_cles: [{ etape_ref: "S2", titre: "Bonne question" }],
            plan_de_progres: [{ etape_ref: "S1", texte: "Clarifier l'accroche" }],
        }, steps);

        expect(normalized.errors).toEqual([]);
        expect(normalized.result).toMatchObject({
            moments_cles: [{
                etape_code: "EXPLORE",
                etape_numero: 2,
                etape_ref: "S2",
                etape_titre: "Explorer le besoin",
            }],
            plan_de_progres: [{
                etape_code: "ENGAGE",
                etape_numero: 1,
                etape_ref: "S1",
                etape_titre: "Engager la conversation",
            }],
        });
    });

    it("rejects invented step refs", () => {
        const normalized = normalizeScorecardNotationSynthesis({
            moments_cles: [{ etape_ref: "A" }],
            plan_de_progres: [],
        }, steps);

        expect(normalized.result).toBeNull();
        expect(normalized.errors).toContain("moments_cles[0] contient une etape_ref inconnue: A.");
    });

    it("keeps at most the first three prioritized progress actions", () => {
        const normalized = normalizeScorecardNotationSynthesis({
            moments_cles: [],
            plan_de_progres: [
                { etape_ref: "S1", texte: "Priorité 1" },
                { etape_ref: "S2", texte: "Priorité 2" },
                { etape_ref: "S1", texte: "Priorité 3" },
                { etape_ref: "S2", texte: "Priorité 4" },
            ],
        }, steps);

        expect(normalized.errors).toEqual([]);
        expect(normalized.result?.plan_de_progres).toHaveLength(3);
        expect(normalized.result?.plan_de_progres).toEqual(expect.arrayContaining([
            expect.objectContaining({ texte: "Priorité 1" }),
            expect.objectContaining({ texte: "Priorité 2" }),
            expect.objectContaining({ texte: "Priorité 3" }),
        ]));
        expect(normalized.result?.plan_de_progres).not.toEqual(expect.arrayContaining([
            expect.objectContaining({ texte: "Priorité 4" }),
        ]));
    });
});
