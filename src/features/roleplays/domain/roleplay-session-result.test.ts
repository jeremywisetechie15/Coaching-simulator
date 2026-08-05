import { describe, expect, it } from "vitest";
import { getRoleplaySessionResultFeedback } from "./roleplay-session-result";

describe("roleplay session result feedback", () => {
    it("congratulates a learner who reaches the scenario threshold", () => {
        expect(getRoleplaySessionResultFeedback(80, 80)).toMatchObject({
            level: "green",
            scorePercent: 80,
            title: "Bravo, objectif atteint !",
        });
    });

    it("uses the scenario threshold to explain the remaining gap", () => {
        expect(getRoleplaySessionResultFeedback(84, 90)).toMatchObject({
            description: "Il vous manque 6 points pour atteindre le seuil de 90 %.",
            level: "yellow",
        });
    });

    it("keeps a useful fallback when the completed notation has no score", () => {
        expect(getRoleplaySessionResultFeedback(null, 80)).toMatchObject({
            level: "neutral",
            scorePercent: null,
            title: "Évaluation prête",
        });
    });
});
