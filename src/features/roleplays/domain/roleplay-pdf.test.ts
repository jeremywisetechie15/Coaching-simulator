import { describe, expect, it } from "vitest";
import {
    DEFAULT_ROLEPLAY_PDF_TEMPLATE,
    ROLEPLAY_PDF_TEMPLATES,
    parseRoleplayPdfTemplate,
} from "./roleplay-pdf";

describe("roleplay PDF domain", () => {
    it("exposes only the report format", () => {
        expect(ROLEPLAY_PDF_TEMPLATES).toEqual({ report: "report" });
        expect(DEFAULT_ROLEPLAY_PDF_TEMPLATE).toBe("report");
    });

    it("normalizes legacy detailed URLs to the report format", () => {
        expect(parseRoleplayPdfTemplate("evaluation")).toBe("report");
        expect(parseRoleplayPdfTemplate("report")).toBe("report");
        expect(parseRoleplayPdfTemplate(null)).toBe("report");
    });
});
