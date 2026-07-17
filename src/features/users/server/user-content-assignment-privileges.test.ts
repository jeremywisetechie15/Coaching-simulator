import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migrationSql = readFileSync(
    resolve(
        process.cwd(),
        "supabase/migrations/20260717072416_add_explicit_user_content_assignments.sql",
    ),
    "utf8",
);

describe("explicit user content assignment privileges", () => {
    it("keeps assignment writes behind the service role", () => {
        for (const table of ["scenario_user_assignments", "quiz_user_assignments"]) {
            expect(migrationSql).toMatch(
                new RegExp(`alter\\s+table\\s+public\\.${table}\\s+enable\\s+row\\s+level\\s+security`, "i"),
            );
            expect(migrationSql).toMatch(
                new RegExp(`revoke\\s+all\\s+on\\s+table\\s+public\\.${table}\\s+from\\s+public,\\s*anon,\\s*authenticated`, "i"),
            );
            expect(migrationSql).toMatch(
                new RegExp(`grant\\s+select,\\s*insert,\\s*delete\\s+on\\s+table\\s+public\\.${table}\\s+to\\s+service_role`, "i"),
            );
            expect(migrationSql).not.toMatch(
                new RegExp(`grant[^;]+on\\s+table\\s+public\\.${table}\\s+to\\s+authenticated`, "i"),
            );
        }
    });

    it("binds access helpers to the authenticated user and published content", () => {
        expect(migrationSql).toMatch(
            /create\s+or\s+replace\s+function\s+private\.has_scenario_user_assignment\s*\(\s*p_scenario_id\s+uuid\s*\)/i,
        );
        expect(migrationSql).toMatch(
            /create\s+or\s+replace\s+function\s+private\.has_quiz_user_assignment\s*\(\s*p_quiz_id\s+uuid\s*\)/i,
        );
        expect(migrationSql).not.toMatch(/has_(?:scenario|quiz)_user_assignment\s*\([^)]*p_user_id/i);
        expect(migrationSql).toContain("assignment.user_id = (select auth.uid())");
        expect(migrationSql).toContain("scenario.status = 'published'::public.content_status");
        expect(migrationSql).toContain("method_quiz.quiz_kind = 'method_knowledge'");
        expect(migrationSql).toContain("method_quiz.status = 'published'::public.content_status");
    });

    it("extends scenario, quiz and resource reads without replacing lifecycle checks", () => {
        expect(migrationSql).toContain("or private.has_scenario_user_assignment(id)");
        expect(migrationSql).toContain("or private.has_quiz_user_assignment(id)");
        expect(migrationSql).toContain("or private.has_scenario_user_assignment(scenarios.id)");
        expect(migrationSql).toContain("is_active = true");
        expect(migrationSql).toContain("status = 'published'::public.content_status");
    });
});
