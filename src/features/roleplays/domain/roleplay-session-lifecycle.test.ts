import { describe, expect, it } from "vitest";
import {
    isRoleplaySessionLifecycleEvent,
    ROLEPLAY_SESSION_LIFECYCLE_EVENT,
    ROLEPLAY_SESSION_LIFECYCLE_STATUS,
} from "./roleplay-session-lifecycle";

describe("roleplay session lifecycle event", () => {
    const event = {
        error: null,
        evaluationEligible: true,
        scenarioId: "scenario-1",
        sessionId: "session-1",
        status: ROLEPLAY_SESSION_LIFECYCLE_STATUS.notationCompleted,
        type: ROLEPLAY_SESSION_LIFECYCLE_EVENT,
    };

    it("accepts a complete lifecycle event", () => {
        expect(isRoleplaySessionLifecycleEvent(event)).toBe(true);
    });

    it("rejects unsupported statuses and incomplete payloads", () => {
        expect(isRoleplaySessionLifecycleEvent({ ...event, status: "unknown" })).toBe(false);
        expect(isRoleplaySessionLifecycleEvent({ ...event, sessionId: undefined })).toBe(false);
    });
});
