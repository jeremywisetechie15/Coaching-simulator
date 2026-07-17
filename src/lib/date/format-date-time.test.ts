import { describe, expect, it } from "vitest";
import {
    APP_TIME_ZONE,
    formatLongDate,
    formatLongDateTime,
    formatShortDateTime,
} from "./format-date-time";

describe("formatShortDateTime", () => {
    it("formats an instant with the application timezone", () => {
        expect(APP_TIME_ZONE).toBe("Europe/Paris");
        expect(formatShortDateTime("2026-07-12T20:34:00.000Z")).toBe("12/07/26 22:34");
    });

    it("returns the fallback for a missing or invalid value", () => {
        expect(formatShortDateTime(null)).toBe("Non renseignée");
        expect(formatShortDateTime("invalid-date", "—")).toBe("—");
    });

    it("formats long dates with the application timezone", () => {
        expect(formatLongDate("2026-07-12T22:34:00.000Z")).toBe("13 juillet 2026");
        expect(formatLongDateTime("2026-07-12T22:34:00.000Z")).toBe("13/07/2026 00:34");
    });

    it("returns the long-format fallback for a missing or invalid value", () => {
        expect(formatLongDate(null)).toBe("");
        expect(formatLongDate("invalid-date", "—")).toBe("—");
        expect(formatLongDateTime(null)).toBe("Jamais connecté");
        expect(formatLongDateTime("invalid-date", "—")).toBe("—");
    });
});
