import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
    new URL(
        "../../../../supabase/migrations/20260811161319_enforce_quiz_method_association_rules.sql",
        import.meta.url,
    ),
    "utf8",
);

describe("quiz method association migration", () => {
    it("keeps method_id available as a contextual reference", () => {
        expect(migration).toContain("optional structural reference for a contextual quiz");
        expect(migration).not.toContain("quiz_kind = 'contextual' and method_id is null");
        expect(migration).not.toContain("where quiz_kind = 'contextual'");
    });

    it("cleans and protects optional method step links without deleting quiz content", () => {
        expect(migration).toContain("update public.quiz_steps quiz_step");
        expect(migration).toContain("set method_step_id = null");
        expect(migration).toContain("enforce_quiz_step_method_link");
        expect(migration).toContain("normalize_quiz_method_detachment");
        expect(migration).not.toContain("delete from public.quiz_steps");
    });

    it("does not rewrite existing roleplay quiz links", () => {
        expect(migration).not.toContain("delete from public.scenario_quizzes");
        expect(migration).not.toContain("enforce_contextual_scenario_quiz");
    });
});
