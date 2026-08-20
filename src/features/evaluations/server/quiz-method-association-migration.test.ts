import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
    new URL(
        "../../../../supabase/migrations/20260820020925_enforce_contextual_quiz_method_rules.sql",
        import.meta.url,
    ),
    "utf8",
);

describe("quiz method association migration", () => {
    it("forbids contextual methods and requires a method only for publication", () => {
        expect(migration).toContain("quiz_kind = 'contextual' and method_id is null");
        expect(migration).toContain("status <> 'published'::public.content_status");
        expect(migration).toContain("or method_id is not null");
        expect(migration).toContain("validate constraint quizzes_method_matches_kind_and_status_check");
    });

    it("cleans only contextual method links without deleting quiz content", () => {
        expect(migration).toContain("update public.quiz_steps quiz_step");
        expect(migration).toContain("set method_step_id = null");
        expect(migration).toContain("update public.quizzes");
        expect(migration).toContain("where quiz_kind = 'contextual'");
        expect(migration).not.toContain("delete from public.quiz_steps");
        expect(migration).not.toContain("delete from public.quiz_attempts");
        expect(migration).not.toContain("delete from public.quiz_questions");
    });

    it("removes implicit detachment conversion and keeps roleplay links untouched", () => {
        expect(migration).toContain(
            "drop trigger if exists normalize_quiz_method_detachment on public.quizzes",
        );
        expect(migration).toContain(
            "drop function if exists private.normalize_quiz_method_detachment()",
        );
        expect(migration).not.toContain("delete from public.scenario_quizzes");
        expect(migration).toContain("Retirez-le d’abord de ces roleplays");
    });

    it("keeps compatibility guards restricted to the service role", () => {
        expect(migration).toContain(
            "revoke all on function private.enforce_scenario_quiz_method_compatibility()",
        );
        expect(migration).toContain(
            "revoke all on function private.enforce_quiz_roleplay_method_compatibility()",
        );
        expect(migration).toContain("to service_role");
    });
});
