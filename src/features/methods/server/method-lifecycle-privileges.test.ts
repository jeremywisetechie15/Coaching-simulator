import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migrationSql = readFileSync(
    resolve(
        process.cwd(),
        "supabase/migrations/20260717195828_grant_service_role_private_lifecycle_validators.sql",
    ),
    "utf8",
);

describe("content lifecycle validator privileges migration", () => {
    it("allows the server role to access only the required private validators", () => {
        expect(migrationSql).toMatch(
            /grant\s+usage\s+on\s+schema\s+private\s+to\s+service_role\s*;/i,
        );

        for (const functionName of [
            "raise_content_lifecycle_conflict",
            "content_audience_covers_dependency",
            "assert_content_audience_dependency",
            "quiz_structure_matches",
            "scorecard_structure_matches",
        ]) {
            expect(migrationSql).toMatch(
                new RegExp(
                    `grant\\s+execute\\s+on\\s+function\\s+private\\.${functionName}\\([\\s\\S]*?\\)\\s+to\\s+service_role\\s*;`,
                    "i",
                ),
            );
        }
    });

    it("does not expose private validators to browser roles", () => {
        expect(migrationSql).not.toMatch(/to\s+(anon|authenticated)\s*;/i);
        expect(migrationSql).not.toMatch(/grant\s+execute\s+on\s+all\s+functions/i);
    });
});
