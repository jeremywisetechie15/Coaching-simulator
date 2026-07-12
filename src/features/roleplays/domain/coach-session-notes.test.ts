import { describe, expect, it } from "vitest";
import {
    ROLEPLAY_COACH_TRANSCRIPT_EVENT,
    formatRoleplayCoachMessageTime,
    isRoleplayCoachTranscriptEvent,
} from "./coach-session-notes";

const validEvent = {
    coachSessionId: "c1295bce-cbe8-4b2c-965b-2ba64a865d1e",
    message: {
        content: "Travaillons votre accroche.",
        id: "88f0cc29-1805-44a2-b86f-d15be4e81975",
        role: "assistant",
        timestamp: "2026-07-12T09:10:11.000Z",
    },
    scenarioId: "f1e40c16-4946-402b-9797-750395707687",
    type: ROLEPLAY_COACH_TRANSCRIPT_EVENT,
};

describe("coach session notes domain", () => {
    it("accepts the shared iframe transcript event contract", () => {
        expect(isRoleplayCoachTranscriptEvent(validEvent)).toBe(true);
    });

    it("rejects events with an unsupported message role", () => {
        expect(isRoleplayCoachTranscriptEvent({
            ...validEvent,
            message: { ...validEvent.message, role: "system" },
        })).toBe(false);
    });

    it("formats message time using the application timezone", () => {
        expect(formatRoleplayCoachMessageTime("2026-07-12T09:10:11.000Z")).toBe("11:10:11");
    });
});
