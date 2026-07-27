import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migrationSql = readFileSync(
    resolve(
        process.cwd(),
        "supabase/migrations/20260727173102_expand_scorecard_transcript_corrections.sql",
    ),
    "utf8",
);

describe("scorecard transcript correction schema migration", () => {
    it("requires a correction array without rewriting existing notation payloads", () => {
        expect(migrationSql).toMatch(
            /"required"\s*:\s*\[[\s\S]*?"corrections"[\s\S]*?\]/,
        );
        expect(migrationSql).toMatch(
            /"corrections"\s*:\s*\{\s*"type"\s*:\s*"array"/,
        );
        expect(migrationSql).not.toMatch(/update\s+public\.sessions/i);
        expect(migrationSql).not.toMatch(/"correction"\s*:/);
    });
});
