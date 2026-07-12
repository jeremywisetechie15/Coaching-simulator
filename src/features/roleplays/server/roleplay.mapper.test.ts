import { describe, expect, it } from "vitest";
import { formatRoleplayDate, formatRoleplayTime } from "./roleplay.mapper";

describe("roleplay session date formatting", () => {
    it("formats the date and time in the application timezone", () => {
        const timestamp = "2026-07-12T22:30:00.000Z";

        expect(formatRoleplayDate(timestamp)).toBe("13/07/2026");
        expect(formatRoleplayTime(timestamp)).toBe("00:30");
    });

    it("returns explicit fallbacks when the timestamp is missing", () => {
        expect(formatRoleplayDate(null)).toBe("Aucune session");
        expect(formatRoleplayTime(null)).toBe("Heure inconnue");
    });
});
