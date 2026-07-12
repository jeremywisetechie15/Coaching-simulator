import { describe, expect, it } from "vitest";
import { SCORECARD_NOTATION_PROMPT_TITLES } from "./scorecard-notation-prompts";

describe("scorecard notation prompt titles", () => {
    it("loads only active notation prompts", () => {
        expect(SCORECARD_NOTATION_PROMPT_TITLES).toEqual({
            methodo: "notation.scorecard.methodo",
            synthese: "notation.scorecard.synthese",
            transcription: "notation.scorecard.transcription",
        });
        expect(SCORECARD_NOTATION_PROMPT_TITLES).not.toHaveProperty("discours");
    });
});
