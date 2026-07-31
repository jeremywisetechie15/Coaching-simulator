import { describe, expect, it } from "vitest";
import {
    getSkillLevel,
    SKILL_LEVEL,
    SKILL_LEVELS,
} from "./skills";

describe("skill mastery levels", () => {
    it("keeps labels ordered from the weakest to the strongest level", () => {
        expect(SKILL_LEVELS).toEqual([
            SKILL_LEVEL.weak,
            SKILL_LEVEL.needsStrengthening,
            SKILL_LEVEL.progressing,
            SKILL_LEVEL.mastered,
        ]);
    });

    it.each([
        [-1, SKILL_LEVEL.weak],
        [0, SKILL_LEVEL.weak],
        [39, SKILL_LEVEL.weak],
        [40, SKILL_LEVEL.needsStrengthening],
        [59, SKILL_LEVEL.needsStrengthening],
        [60, SKILL_LEVEL.progressing],
        [79, SKILL_LEVEL.progressing],
        [80, SKILL_LEVEL.mastered],
        [100, SKILL_LEVEL.mastered],
    ])("maps a score of %i to %s", (score, expectedLevel) => {
        expect(getSkillLevel(score)).toBe(expectedLevel);
    });
});
