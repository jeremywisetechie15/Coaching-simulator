import { describe, expect, it } from "vitest";
import {
    ROLEPLAY_NOTATION_FOLLOWUP_TABS,
    ROLEPLAY_NOTATION_TABS,
} from "./roleplay-notation-tabs";

describe("roleplay notation tabs", () => {
    it("excludes the retired discourse analysis call", () => {
        expect(ROLEPLAY_NOTATION_TABS).toEqual([
            "synthese",
            "methodo",
            "transcription",
        ]);
        expect(ROLEPLAY_NOTATION_FOLLOWUP_TABS).toEqual([
            "synthese",
            "transcription",
        ]);
    });
});
