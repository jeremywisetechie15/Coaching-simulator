import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { CONTENT_CATEGORIES_BY_DOMAIN, CONTENT_DOMAINS } from "@/features/content/domain";

const migrationSql = readFileSync(
    resolve(
        process.cwd(),
        "supabase/migrations/20260804083310_enforce_scenario_domain_category_taxonomy.sql",
    ),
    "utf8",
);

describe("roleplay taxonomy database migration", () => {
    it("enforces every application domain and category on scenarios", () => {
        expect(migrationSql).toContain("scenarios_domain_check");
        expect(migrationSql).toContain("scenarios_category_domain_check");

        for (const domain of CONTENT_DOMAINS) {
            expect(migrationSql).toContain(`'${domain}'`);
            for (const category of CONTENT_CATEGORIES_BY_DOMAIN[domain]) {
                expect(migrationSql).toContain(`'${category}'`);
            }
        }
    });

    it("adds constraints without rewriting scenario data", () => {
        expect(migrationSql).toContain("not valid");
        expect(migrationSql).toContain("validate constraint scenarios_domain_check");
        expect(migrationSql).toContain("validate constraint scenarios_category_domain_check");
        expect(migrationSql).not.toMatch(/(?:update|delete\s+from|insert\s+into)\s+public\.scenarios/i);
    });
});
