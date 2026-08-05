import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migrationSql = readFileSync(
    resolve(
        process.cwd(),
        "supabase/migrations/20260805220500_anchor_scorecard_evidence_to_session_messages.sql",
    ),
    "utf8",
);

describe("scorecard session evidence schema migration", () => {
    it("requires learner message refs without rewriting historical notations", () => {
        expect(migrationSql).toMatch(
            /"required"\s*:\s*\[[\s\S]*?"preuve_message_refs"[\s\S]*?\]/,
        );
        expect(migrationSql).toMatch(
            /"preuve_message_refs"\s*:\s*\{\s*"type"\s*:\s*"array"/,
        );
        expect(migrationSql).not.toMatch(/update\s+public\.sessions/i);
        expect(migrationSql).not.toMatch(/delete\s+from\s+public\.sessions/i);
    });
});
