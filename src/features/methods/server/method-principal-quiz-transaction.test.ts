import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
    new URL(
        "../../../../supabase/migrations/20260713201349_simplify_content_lifecycle.sql",
        import.meta.url,
    ),
    "utf8",
);
const aggregateStart = migration.indexOf(
    "create or replace function public.admin_update_method_aggregate",
);
const aggregate = migration.slice(aggregateStart);
const correctionMigration = readFileSync(
    new URL(
        "../../../../supabase/migrations/20260817161350_allow_used_quiz_method_association_corrections.sql",
        import.meta.url,
    ),
    "utf8",
);
const createAssociationStart = correctionMigration.indexOf(
    "create or replace function public.admin_sync_method_quiz_association",
);
const createAssociationAggregate = correctionMigration.slice(
    createAssociationStart,
    correctionMigration.indexOf(
        "-- The aggregate update stays atomic.",
        createAssociationStart,
    ),
);

describe("method principal quiz transaction", () => {
    it("locks the selected quiz before changing the principal association", () => {
        expect(aggregate).toContain(
            "select * into quiz_row from public.quizzes where id = p_quiz_id for update",
        );
    });

    it("demotes the former principal before promoting the selected quiz", () => {
        const demotion = aggregate.indexOf(
            "update public.quizzes set method_id = null, quiz_kind = 'contextual'",
        );
        const promotion = aggregate.indexOf(
            "update public.quizzes set method_id = p_method_id, quiz_kind = 'method_knowledge'",
        );

        expect(demotion).toBeGreaterThan(-1);
        expect(promotion).toBeGreaterThan(demotion);
    });

    it("keeps the aggregate callable only by the service role", () => {
        expect(aggregate).toContain("from public, anon, authenticated");
        expect(aggregate).toContain("to service_role");
    });

    it("uses the same atomic promotion rules during method creation", () => {
        expect(createAssociationAggregate).toContain(
            "from public.quizzes\n        where id = p_quiz_id\n        for update",
        );
        expect(createAssociationAggregate).toContain(
            "set method_id = null,\n        quiz_kind = 'contextual'",
        );
        expect(createAssociationAggregate).toContain(
            "set method_id = p_method_id,\n            quiz_kind = 'method_knowledge'",
        );
    });
});
