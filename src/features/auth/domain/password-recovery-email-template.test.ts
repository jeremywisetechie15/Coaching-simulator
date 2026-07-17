import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const template = readFileSync(
    resolve(process.cwd(), "supabase/templates/recovery.html"),
    "utf8",
);

describe("password recovery email template", () => {
    it("uses a recovery token hash so the link works across devices", () => {
        expect(template).toContain("{{ .RedirectTo }}");
        expect(template).toContain("{{ .TokenHash }}");
        expect(template).toContain("type=recovery");
        expect(template).not.toContain("{{ .ConfirmationURL }}");
    });
});
