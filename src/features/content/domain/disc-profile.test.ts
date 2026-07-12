import { describe, expect, it } from "vitest";
import { DISC_PROFILE, getDiscProfileTone } from "./disc-profile";

describe("DISC profile tones", () => {
    it("maps every DISC profile to its canonical color", () => {
        expect(getDiscProfileTone(DISC_PROFILE.dominant)).toBe("red");
        expect(getDiscProfileTone(DISC_PROFILE.influential)).toBe("yellow");
        expect(getDiscProfileTone(DISC_PROFILE.stable)).toBe("green");
        expect(getDiscProfileTone(DISC_PROFILE.conscientious)).toBe("blue");
        expect(getDiscProfileTone(DISC_PROFILE.unknown)).toBe("neutral");
    });
});
