import { describe, expect, it } from "vitest";
import { ROLEPLAY_ROUTES } from "./roleplay-routes";

describe("roleplay iframe routes", () => {
    it("builds the roleplay session route from the shared contract", () => {
        expect(ROLEPLAY_ROUTES.app.session("scenario/1")).toBe(
            "/roleplays/scenario%2F1/session",
        );
    });

    it("keeps the evaluated session in persona feedback mode", () => {
        expect(ROLEPLAY_ROUTES.app.personaFeedback("scenario/1", "session/2", "transcript/3")).toBe(
            "/iframe?scenario_id=scenario%2F1&variant=coach&ref_session_id=session%2F2&transcript_session_id=transcript%2F3",
        );
    });

    it("keeps the evaluated session in concise coach feedback mode", () => {
        expect(ROLEPLAY_ROUTES.app.sessionCoachFeedback("scenario/1", "session/2", "transcript/3")).toBe(
            "/iframe?scenario_id=scenario%2F1&mode=coach&coach_mode=feedback&ref_session_id=session%2F2&transcript_session_id=transcript%2F3",
        );
    });

    it("keeps the evaluated session in global coach debrief mode", () => {
        expect(ROLEPLAY_ROUTES.app.sessionDebrief("scenario/1", "session/2", "transcript/3")).toBe(
            "/iframe?scenario_id=scenario%2F1&mode=coach&coach_mode=notation&ref_session_id=session%2F2&transcript_session_id=transcript%2F3",
        );
    });
});
