import { describe, expect, it } from "vitest";
import { hideSystemInstructionsFromLearner } from "./system-instructions-visibility";

describe("hideSystemInstructionsFromLearner", () => {
    const detail = {
        id: "content-1",
        name: "Contenu IA",
        systemInstructions: "Instructions système confidentielles",
    };

    it("conserve les instructions pour un administrateur", () => {
        expect(hideSystemInstructionsFromLearner(detail, true)).toBe(detail);
    });

    it("retire les instructions pour un apprenant", () => {
        expect(hideSystemInstructionsFromLearner(detail, false)).toEqual({
            id: "content-1",
            name: "Contenu IA",
            systemInstructions: "",
        });
    });
});
