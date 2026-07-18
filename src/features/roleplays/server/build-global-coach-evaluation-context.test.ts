import { describe, expect, it } from "vitest";
import { buildGlobalCoachEvaluationContext } from "./build-global-coach-evaluation-context";

describe("buildGlobalCoachEvaluationContext", () => {
    it("keeps the complete global synthesis needed to discuss strengths and improvements", () => {
        const context = buildGlobalCoachEvaluationContext({
            score_global: { valeur: 74 },
            synthese: {
                appreciation_globale: { texte: "Une session structurée." },
                axes_amelioration: ["Préciser l'accroche"],
                plan_de_progres: [{ texte: "Préparer une accroche ciblée" }],
                points_positifs: ["Bonne écoute"],
            },
        });

        expect(context.appreciation).toBe("Une session structurée.");
        expect(context.scoreGlobal).toEqual({ valeur: 74 });
        expect(context.synthese).toMatchObject({
            axes_amelioration: ["Préciser l'accroche"],
            points_positifs: ["Bonne écoute"],
        });
    });

    it("returns an explicit fallback when the global appreciation is absent", () => {
        expect(buildGlobalCoachEvaluationContext({ synthese: {} }).appreciation).toBe(
            "Aucune appréciation globale disponible.",
        );
    });
});
