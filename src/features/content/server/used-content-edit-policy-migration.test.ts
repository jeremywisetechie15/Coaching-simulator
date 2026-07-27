import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migrationSql = readFileSync(
    resolve(
        process.cwd(),
        "supabase/migrations/20260727162250_align_used_quiz_scorecard_edit_policies.sql",
    ),
    "utf8",
);
const quizFunction = migrationSql.slice(
    migrationSql.indexOf("create or replace function private.quiz_structure_matches"),
    migrationSql.indexOf("create or replace function private.scorecard_structure_matches"),
);
const scorecardFunction = migrationSql.slice(
    migrationSql.indexOf("create or replace function private.scorecard_structure_matches"),
);

describe("used content database edit policy migration", () => {
    it("keeps quiz structure fields locked without comparing editable content", () => {
        for (const structuralColumn of [
            "question_type",
            "competence_id",
            "dimension_item_id",
            "is_correct",
            "attachment_type",
            "storage_path",
        ]) {
            expect(quizFunction).toContain(structuralColumn);
        }

        for (const editableColumn of [
            "weight",
            "prompt",
            "points",
            "explanation",
            "label",
            "external_url",
        ]) {
            expect(quizFunction).not.toMatch(new RegExp(`\\b${editableColumn}\\b`));
        }
    });

    it("keeps scorecard associations locked without comparing editable content", () => {
        for (const structuralColumn of [
            "method_step_id",
            "step_order",
            "skill_id",
            "dimension",
            "dimension_item_id",
        ]) {
            expect(scorecardFunction).toContain(structuralColumn);
        }

        for (const editableColumn of [
            "name",
            "weight_percent",
            "criterion_order",
            "criterion_key",
            "expected_evidence",
            "max_points",
            "ai_instruction",
            "verbatim",
        ]) {
            expect(scorecardFunction).not.toMatch(new RegExp(`\\b${editableColumn}\\b`));
        }
    });
});
