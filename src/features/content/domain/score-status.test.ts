import { describe, expect, it } from "vitest";
import {
    CONTENT_SCORE_STATUS,
    getContentScoreStatus,
} from "./score-status";

describe("getContentScoreStatus", () => {
    it("uses the content validation threshold for the success status", () => {
        expect(getContentScoreStatus(79, 80)).toBe(CONTENT_SCORE_STATUS.warning);
        expect(getContentScoreStatus(80, 80)).toBe(CONTENT_SCORE_STATUS.success);
        expect(getContentScoreStatus(50, 50)).toBe(CONTENT_SCORE_STATUS.success);
    });

    it("keeps sub-threshold scores warning or danger", () => {
        expect(getContentScoreStatus(50, 80)).toBe(CONTENT_SCORE_STATUS.warning);
        expect(getContentScoreStatus(49, 80)).toBe(CONTENT_SCORE_STATUS.danger);
    });

    it("normalizes out-of-range values", () => {
        expect(getContentScoreStatus(120, 80)).toBe(CONTENT_SCORE_STATUS.success);
        expect(getContentScoreStatus(-20, 80)).toBe(CONTENT_SCORE_STATUS.danger);
    });
});
