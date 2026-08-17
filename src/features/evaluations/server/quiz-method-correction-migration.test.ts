import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
    new URL(
        "../../../../supabase/migrations/20260817161350_allow_used_quiz_method_association_corrections.sql",
        import.meta.url,
    ),
    "utf8",
);
const structureMatcher = migration.slice(
    0,
    migration.indexOf("-- The aggregate update stays atomic."),
);
const usedQuizUpdateStart = migration.indexOf(
    "    else\n        update public.quiz_steps",
);
const usedQuizUpdate = migration.slice(
    usedQuizUpdateStart,
    migration.indexOf("    end if;", usedQuizUpdateStart),
);

describe("used quiz method correction migration", () => {
    it("keeps stable quiz-step identity and order protected", () => {
        expect(structureMatcher).toContain("select id, quiz_id, step_order");
        expect(structureMatcher).not.toContain("method_step_id");
    });

    it("keeps questions, correct answers, competencies and attachments structural", () => {
        expect(structureMatcher).toContain("question_type");
        expect(structureMatcher).toContain("is_correct");
        expect(structureMatcher).toContain("competence_id");
        expect(structureMatcher).toContain("attachment_type");
    });

    it("persists method mappings and the existing editable child fields", () => {
        expect(migration).toContain("if not has_attempts then");
        expect(migration).toContain("set method_step_id = incoming_step.method_step_id");
        expect(migration).toContain("name = incoming_step.name");
        expect(migration).toContain("weight = incoming_step.weight");
        expect(migration).toContain("set prompt = incoming_question.prompt");
        expect(migration).toContain("points = incoming_question.points");
        expect(migration).toContain("explanation = incoming_question.explanation");
        expect(migration).toContain("set label = incoming_choice.label");
        expect(migration).toContain("set label = incoming_attachment.label");
        expect(migration).toContain("external_url = incoming_attachment.external_url");
        expect(migration).toContain("quiz_step.quiz_id = p_quiz_id");
    });

    it("does not persist structural child fields for a used quiz", () => {
        expect(usedQuizUpdateStart).toBeGreaterThan(-1);
        expect(usedQuizUpdate).not.toContain("step_order =");
        expect(usedQuizUpdate).not.toContain("question_type =");
        expect(usedQuizUpdate).not.toContain("competence_id =");
        expect(usedQuizUpdate).not.toContain("is_correct =");
        expect(usedQuizUpdate).not.toContain("attachment_type =");
        expect(usedQuizUpdate).not.toContain("storage_bucket =");
        expect(usedQuizUpdate).not.toContain("storage_path =");
        expect(usedQuizUpdate).not.toContain("update public.quiz_step_competencies");
    });

    it("does not rewrite attempts or roleplay associations", () => {
        expect(migration).not.toContain("update public.quiz_attempts");
        expect(migration).not.toContain("update public.scenario_quizzes");
        expect(migration).not.toContain("delete from public.scenario_quizzes");
    });

    it("rejects incompatible roleplay links in both write directions", () => {
        expect(migration).toContain("private.enforce_scenario_quiz_method_compatibility");
        expect(migration).toContain("private.enforce_quiz_roleplay_method_compatibility");
        expect(migration).toContain("before insert or update on public.scenario_quizzes");
        expect(migration).toContain("before update of quiz_kind, method_id on public.quizzes");
        expect(migration).toContain("Retirez-le d’abord de ces roleplays");
    });

    it("keeps the compatibility guards and aggregate service-role only", () => {
        expect(migration).toContain(
            "revoke all on function private.enforce_scenario_quiz_method_compatibility()",
        );
        expect(migration).toContain(
            "revoke all on function private.enforce_quiz_roleplay_method_compatibility()",
        );
        expect(migration).toContain(
            "grant execute on function public.admin_sync_method_quiz_association(uuid, uuid)",
        );
    });
});
