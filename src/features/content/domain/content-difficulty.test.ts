import { describe, expect, it } from "vitest";
import {
    CONTENT_DIFFICULTIES,
    CONTENT_DIFFICULTY,
    isContentDifficulty,
    normalizeContentDifficulty,
} from "./content-difficulty";

describe("content difficulty", () => {
    it("keeps the shared difficulty vocabulary stable", () => {
        expect(CONTENT_DIFFICULTIES).toEqual(["Facile", "Moyen", "Difficile"]);
        expect(CONTENT_DIFFICULTY.medium).toBe("Moyen");
    });

    it("normalizes unknown or missing values to null", () => {
        expect(isContentDifficulty("Difficile")).toBe(true);
        expect(normalizeContentDifficulty("Difficile")).toBe("Difficile");
        expect(normalizeContentDifficulty("Inconnu")).toBeNull();
        expect(normalizeContentDifficulty(null)).toBeNull();
    });
});
