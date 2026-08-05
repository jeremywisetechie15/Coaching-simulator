import { describe, expect, it } from "vitest";
import { resolveRoleplaySessionEvaluationScore } from "./roleplay-session-evaluation-score";

describe("roleplay session evaluation score", () => {
    it("preserves an explicit normalized zero instead of replacing it", () => {
        expect(resolveRoleplaySessionEvaluationScore({
            notationJson: { score_global: { valeur: 78 } },
            normalizedScorePercent: 0,
        })).toBe(0);
    });

    it("keeps reading the score stored in an historical notation payload", () => {
        expect(resolveRoleplaySessionEvaluationScore({
            notationJson: { score_global: { valeur: 72 } },
            normalizedScorePercent: null,
        })).toBe(72);
    });

    it("defaults to zero when this session contains no score", () => {
        expect(resolveRoleplaySessionEvaluationScore({
            notationJson: null,
            normalizedScorePercent: null,
        })).toBe(0);
    });
});
