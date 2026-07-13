import { describe, expect, it } from "vitest";
import {
    isForcedRoleplayNotationRegeneration,
    ROLEPLAY_NOTATION_STATUS,
    shouldReuseCompletedRoleplayNotation,
} from "./roleplay-notation";

describe("roleplay notation request", () => {
    it("only treats an explicit boolean as forced regeneration", () => {
        expect(isForcedRoleplayNotationRegeneration(true)).toBe(true);
        expect(isForcedRoleplayNotationRegeneration(false)).toBe(false);
        expect(isForcedRoleplayNotationRegeneration("true")).toBe(false);
    });

    it("reuses a completed notation for automatic calls", () => {
        expect(shouldReuseCompletedRoleplayNotation({
            forceRegeneration: false,
            hasNotation: true,
            notationStatus: ROLEPLAY_NOTATION_STATUS.completed,
        })).toBe(true);
    });

    it("does not reuse notation during an explicit admin regeneration", () => {
        expect(shouldReuseCompletedRoleplayNotation({
            forceRegeneration: true,
            hasNotation: true,
            notationStatus: ROLEPLAY_NOTATION_STATUS.completed,
        })).toBe(false);
    });
});
