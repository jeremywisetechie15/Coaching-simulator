import { describe, expect, it } from "vitest";
import {
    activeDurationHeartbeatDto,
    createAiConversationDto,
    updateAiConversationDto,
} from "./activity-tracking.dto";

describe("activity tracking DTOs", () => {
    it("accepts the supported AI conversation types and statuses", () => {
        expect(createAiConversationDto.parse({ interactionType: "ask_persona" })).toEqual({
            interactionType: "ask_persona",
        });
        expect(createAiConversationDto.parse({
            coachMode: "feedback",
            interactionType: "coach",
        })).toEqual({
            coachMode: "feedback",
            interactionType: "coach",
        });
        expect(updateAiConversationDto.parse({ activeSeconds: 12, status: "completed" })).toMatchObject({
            activeSeconds: 12,
            aiMessageDelta: 0,
            status: "completed",
            userMessageDelta: 0,
        });
    });

    it("rejects oversized, negative and unknown heartbeat fields", () => {
        expect(activeDurationHeartbeatDto.safeParse({ activeSeconds: 61 }).success).toBe(false);
        expect(activeDurationHeartbeatDto.safeParse({ activeSeconds: -1 }).success).toBe(false);
        expect(activeDurationHeartbeatDto.safeParse({ activeSeconds: 1, forged: true }).success).toBe(false);
    });

    it("rejects a coach mode on an Ask Persona conversation", () => {
        expect(createAiConversationDto.safeParse({
            coachMode: "feedback",
            interactionType: "ask_persona",
        }).success).toBe(false);
        expect(createAiConversationDto.safeParse({
            coachMode: "unknown",
            interactionType: "coach",
        }).success).toBe(false);
    });
});
