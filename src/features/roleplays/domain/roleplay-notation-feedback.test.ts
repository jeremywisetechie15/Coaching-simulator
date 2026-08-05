import { describe, expect, it } from "vitest";
import {
    getRoleplayNotationApiErrorMessage,
    getRoleplayNotationApiScore,
    ROLEPLAY_NOTATION_FEEDBACK_MESSAGES,
} from "./roleplay-notation-feedback";

describe("roleplay notation feedback", () => {
    it("prefers the detailed API error", () => {
        expect(getRoleplayNotationApiErrorMessage({
            details: "Le critère C2 est manquant.",
            error: "Erreur notation scorecard",
        })).toBe("Le critère C2 est manquant.");
    });

    it("falls back to the API error then to the shared message", () => {
        expect(getRoleplayNotationApiErrorMessage({ error: "Service IA indisponible." }))
            .toBe("Service IA indisponible.");
        expect(getRoleplayNotationApiErrorMessage(null))
            .toBe(ROLEPLAY_NOTATION_FEEDBACK_MESSAGES.generationError);
    });

    it("extracts the shared global score from an API response", () => {
        expect(getRoleplayNotationApiScore({
            notation: { score_global: { valeur: 84.4 } },
        })).toBe(84);
        expect(getRoleplayNotationApiScore({ success: true })).toBeNull();
    });
});
