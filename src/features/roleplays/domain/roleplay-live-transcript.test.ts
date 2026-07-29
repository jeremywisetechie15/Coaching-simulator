import { describe, expect, it } from "vitest";
import {
    ROLEPLAY_LIVE_TRANSCRIPT_EVENT,
    appendRoleplayLiveTranscriptMessage,
    isMatchingRoleplayLiveTranscriptEvent,
    isRoleplayLiveTranscriptEvent,
    toRoleplayTranscriptMessages,
    type RoleplayLiveTranscriptEvent,
} from "./roleplay-live-transcript";

const validEvent: RoleplayLiveTranscriptEvent = {
    message: {
        content: "Travaillons votre accroche.",
        id: "88f0cc29-1805-44a2-b86f-d15be4e81975",
        role: "assistant",
        timestamp: "2026-07-12T09:10:11.000Z",
    },
    scenarioId: "f1e40c16-4946-402b-9797-750395707687",
    transcriptSessionId: "c1295bce-cbe8-4b2c-965b-2ba64a865d1e",
    type: ROLEPLAY_LIVE_TRANSCRIPT_EVENT,
};

describe("roleplay live transcript", () => {
    it("accepts the shared iframe transcript event contract", () => {
        expect(isRoleplayLiveTranscriptEvent(validEvent)).toBe(true);
    });

    it("rejects events with an unsupported message role", () => {
        expect(isRoleplayLiveTranscriptEvent({
            ...validEvent,
            message: { ...validEvent.message, role: "system" },
        })).toBe(false);
    });

    it("isolates messages by scenario and live transcript session", () => {
        expect(isMatchingRoleplayLiveTranscriptEvent(validEvent, {
            scenarioId: validEvent.scenarioId,
            transcriptSessionId: validEvent.transcriptSessionId,
        })).toBe(true);
        expect(isMatchingRoleplayLiveTranscriptEvent(validEvent, {
            scenarioId: validEvent.scenarioId,
            transcriptSessionId: "another-session",
        })).toBe(false);
        expect(isMatchingRoleplayLiveTranscriptEvent(validEvent, {
            scenarioId: "another-scenario",
            transcriptSessionId: validEvent.transcriptSessionId,
        })).toBe(false);
    });

    it("deduplicates messages by their realtime identifier", () => {
        const messages = [validEvent.message];

        expect(appendRoleplayLiveTranscriptMessage(messages, validEvent.message)).toBe(messages);
    });

    it("maps only the live conversation to the evaluation transcript format", () => {
        expect(toRoleplayTranscriptMessages([
            validEvent.message,
            {
                content: "Je reformule mon accroche.",
                id: "d2862fae-c4e5-4c7f-ae3e-ec8e82c7d73e",
                role: "user",
                timestamp: "2026-07-12T09:10:20.000Z",
            },
        ])).toEqual([
            {
                id: validEvent.message.id,
                speaker: "persona",
                text: "Travaillons votre accroche.",
                time: "11:10:11",
            },
            {
                id: "d2862fae-c4e5-4c7f-ae3e-ec8e82c7d73e",
                speaker: "you",
                text: "Je reformule mon accroche.",
                time: "11:10:20",
            },
        ]);
    });
});
