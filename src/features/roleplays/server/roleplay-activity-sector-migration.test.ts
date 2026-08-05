import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { ACTIVITY_SECTORS } from "@/features/content/domain";

const migrationSql = readFileSync(
    resolve(
        process.cwd(),
        "supabase/migrations/20260805204742_add_roleplay_activity_sector.sql",
    ),
    "utf8",
);

describe("roleplay activity sector migration", () => {
    it("adds a nullable text column without a default or backfill", () => {
        expect(migrationSql).toMatch(
            /add\s+column\s+if\s+not\s+exists\s+activity_sector_code\s+text\s*;/i,
        );
        expect(migrationSql).not.toMatch(/activity_sector_code\s+text\s+not\s+null/i);
        expect(migrationSql).not.toMatch(/activity_sector_code\s+text\s+default/i);
        expect(migrationSql).not.toMatch(/update\s+public\.scenarios\s+set\s+activity_sector_code/i);
    });

    it("keeps the database constraint synchronized with the shared catalog", () => {
        const constraintValues = migrationSql.match(
            /activity_sector_code\s+in\s*\(([\s\S]+?)\)/i,
        );
        const databaseCodes = constraintValues?.[1].match(/'[A-Z]{3}'/g)
            ?.map((value) => value.slice(1, -1));

        expect(databaseCodes).toEqual(ACTIVITY_SECTORS.map(({ code }) => code));
    });

    it("updates the aggregate RPC while preserving missing legacy payload fields", () => {
        expect(migrationSql).toMatch(
            /when\s+p_roleplay\s+\?\s+'activity_sector_code'\s+then\s+payload\.activity_sector_code/i,
        );
        expect(migrationSql).toMatch(/else\s+current_scenario\.activity_sector_code/i);
    });
});
