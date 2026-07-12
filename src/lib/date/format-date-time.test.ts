import { describe, expect, it } from "vitest";
import { APP_TIME_ZONE, formatShortDateTime } from "./format-date-time";

describe("formatShortDateTime", () => {
    it("formats an instant with the application timezone", () => {
        expect(APP_TIME_ZONE).toBe("Europe/Paris");
        expect(formatShortDateTime("2026-07-12T20:34:00.000Z")).toBe("12/07/26 22:34");
    });

    it("returns the fallback for a missing or invalid value", () => {
        expect(formatShortDateTime(null)).toBe("Non renseignée");
        expect(formatShortDateTime("invalid-date", "—")).toBe("—");
    });
});
