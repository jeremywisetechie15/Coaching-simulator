import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const baseMigrationSql = readFileSync(
    resolve(
        process.cwd(),
        "supabase/migrations/20260728100000_protect_used_skill_edits.sql",
    ),
    "utf8",
);
const nameEditMigrationSql = readFileSync(
    resolve(
        process.cwd(),
        "supabase/migrations/20260805090139_allow_protected_skill_name_edits.sql",
    ),
    "utf8",
);
const migrationSql = `${baseMigrationSql}\n${nameEditMigrationSql}`;
const usageFunction = baseMigrationSql.slice(
    baseMigrationSql.indexOf(
        "create or replace function private.skill_has_protected_usage",
    ),
    baseMigrationSql.indexOf(
        "create or replace function private.skill_locked_configuration_matches",
    ),
);
const configurationFunction = nameEditMigrationSql.slice(
    nameEditMigrationSql.indexOf(
        "create or replace function private.skill_locked_configuration_matches",
    ),
    nameEditMigrationSql.indexOf(
        "create or replace function public.admin_update_skill_aggregate",
    ),
);
const aggregateFunction = nameEditMigrationSql.slice(
    nameEditMigrationSql.indexOf(
        "create or replace function public.admin_update_skill_aggregate",
    ),
    nameEditMigrationSql.indexOf(
        "comment on function private.skill_locked_configuration_matches",
    ),
);

describe("protected skill database edit policy migration", () => {
    it("locks published and archived scenarios while leaving drafts editable", () => {
        const scenarioUsage = usageFunction.slice(
            usageFunction.indexOf("from public.scorecard_criteria"),
            usageFunction.indexOf("from public.quiz_step_competencies"),
        );

        expect(scenarioUsage).toContain(
            "'published'::public.content_status",
        );
        expect(scenarioUsage).toContain(
            "'archived'::public.content_status",
        );
        expect(scenarioUsage).not.toContain(
            "'draft'::public.content_status",
        );
    });

    it("locks published and archived quizzes through steps and questions", () => {
        expect(usageFunction).toContain(
            "from public.quiz_step_competencies",
        );
        expect(usageFunction).toContain(
            "from public.quiz_questions",
        );
        expect(
            usageFunction.match(/'published'::public\.content_status/g),
        ).toHaveLength(3);
        expect(
            usageFunction.match(/'archived'::public\.content_status/g),
        ).toHaveLength(3);
        expect(usageFunction).not.toContain(
            "'draft'::public.content_status",
        );
    });

    it("keeps historical roleplay sessions, notation results and quiz attempts protected", () => {
        for (const historicalTable of [
            "public.sessions",
            "public.roleplay_session_criterion_results",
            "public.quiz_attempts",
        ]) {
            expect(usageFunction).toContain(historicalTable);
        }
    });

    it("compares every taxonomy, target and dimension field but not the name or description", () => {
        for (const lockedColumn of [
            "skill_type",
            "domain",
            "category",
            "visibility_scope",
            "organization_id",
            "group_id",
            "assigned_user_id",
            "dimension",
            "label",
            "item_order",
        ]) {
            expect(configurationFunction).toMatch(
                new RegExp(`\\b${lockedColumn}\\b`),
            );
        }

        expect(configurationFunction).not.toMatch(/existing\.name\b/);
        expect(configurationFunction).not.toMatch(/\bdescription\b/);
    });

    it("updates the displayed name and description through the aggregate RPC", () => {
        expect(aggregateFunction).toContain("set name = payload.name");
        expect(aggregateFunction).toContain("description = payload.description");
        expect(aggregateFunction).toContain(
            "Son libellé et sa description peuvent être modifiés.",
        );
    });

    it("rejects a direct aggregate RPC bypass before updating the skill", () => {
        const guardPosition = aggregateFunction.indexOf(
            "private.skill_has_protected_usage(p_skill_id)",
        );
        const updatePosition = aggregateFunction.indexOf(
            "update public.skills",
        );

        expect(guardPosition).toBeGreaterThan(-1);
        expect(updatePosition).toBeGreaterThan(guardPosition);
        expect(aggregateFunction).toContain(
            "private.skill_locked_configuration_matches",
        );
        expect(aggregateFunction).toContain(
            "incoming.skill_id is distinct from p_skill_id",
        );
    });

    it("exposes the usage flag only to the service role", () => {
        expect(migrationSql).toContain(
            "revoke all on function public.admin_skill_has_protected_usage(text)\nfrom public, anon, authenticated;",
        );
        expect(migrationSql).toContain(
            "grant execute on function public.admin_skill_has_protected_usage(text)\nto service_role;",
        );
    });

    it("does not rewrite or delete historical learner data", () => {
        for (const historicalTable of [
            "roleplay_session_criterion_results",
            "quiz_attempts",
        ]) {
            expect(migrationSql).not.toMatch(
                new RegExp(
                    `(?:update|delete\\s+from|insert\\s+into)\\s+public\\.${historicalTable}`,
                    "i",
                ),
            );
        }
    });
});
