import { describe, expect, it } from "vitest";
import { resolveLearnerAssignedSkillIds } from "./learner-skill-assignment";

describe("resolveLearnerAssignedSkillIds", () => {
    it("keeps direct, roleplay, and quiz skills without duplicates", () => {
        expect(resolveLearnerAssignedSkillIds({
            directSkillIds: ["skill-direct", "skill-shared"],
            quizSkillIds: ["skill-quiz", "skill-shared"],
            roleplaySkillIds: ["skill-roleplay", "skill-shared"],
        })).toEqual([
            "skill-direct",
            "skill-shared",
            "skill-roleplay",
            "skill-quiz",
        ]);
    });

    it("ignores empty references", () => {
        expect(resolveLearnerAssignedSkillIds({
            directSkillIds: ["", "  "],
            quizSkillIds: [],
            roleplaySkillIds: [],
        })).toEqual([]);
    });
});
