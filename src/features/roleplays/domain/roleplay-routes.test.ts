import { describe, expect, it } from "vitest";
import { ROLEPLAY_ROUTES } from "./roleplay-routes";

describe("roleplay iframe routes", () => {
    it("keeps the evaluated session in persona feedback mode", () => {
        expect(ROLEPLAY_ROUTES.app.personaFeedback("scenario/1", "session/2")).toBe(
            "/iframe?scenario_id=scenario%2F1&variant=coach&ref_session_id=session%2F2",
        );
    });

    it("keeps the evaluated session in coach debrief mode", () => {
        expect(ROLEPLAY_ROUTES.app.sessionDebrief("scenario/1", "session/2")).toBe(
            "/iframe?scenario_id=scenario%2F1&mode=coach&coach_mode=after_training&ref_session_id=session%2F2",
        );
    });
});
