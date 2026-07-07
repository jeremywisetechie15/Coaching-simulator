import { describe, expect, it } from "vitest";
import { calculateLegacyMethodoStepScore } from "./legacy-notation-score";

describe("legacy notation score", () => {
    it("uses detailed score percentage before the top-level AI step score", () => {
        expect(
            calculateLegacyMethodoStepScore({
                score: 0,
                grille_calcul: {
                    score_detail: {
                        pourcentage: 17,
                        total_max: 35,
                        total_obtenu: 6,
                    },
                },
            }),
        ).toBe(17);
    });

    it("calculates the step score from criteria points when score_detail is missing", () => {
        expect(
            calculateLegacyMethodoStepScore({
                score: 0,
                grille_calcul: {
                    criteres: [
                        {
                            score_max: 5,
                            score_obtenu: 0,
                        },
                        {
                            score_max: 5,
                            score_obtenu: 3,
                        },
                    ],
                },
            }),
        ).toBe(30);
    });

    it("falls back to the top-level score when no detailed scoring exists", () => {
        expect(calculateLegacyMethodoStepScore({ score: 65 })).toBe(65);
    });
});
