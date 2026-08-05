import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { ACTIVITY_SECTORS } from "@/features/profile/domain/activity-sector";

const migrationSql = readFileSync(
    resolve(
        process.cwd(),
        "supabase/migrations/20260805135807_add_profile_activity_sector.sql",
    ),
    "utf8",
);

describe("profile activity sector migration", () => {
    it("adds a nullable text column without a default", () => {
        expect(migrationSql).toMatch(
            /add\s+column\s+if\s+not\s+exists\s+activity_sector_code\s+text\s*;/i,
        );
        expect(migrationSql).not.toMatch(/activity_sector_code\s+text\s+not\s+null/i);
        expect(migrationSql).not.toMatch(/activity_sector_code\s+text\s+default/i);
    });

    it("keeps the database constraint synchronized with the application catalog", () => {
        const constraintValues = migrationSql.match(
            /activity_sector_code\s+in\s*\(([\s\S]+?)\)/i,
        );
        const databaseCodes = constraintValues?.[1].match(/'[A-Z]{3}'/g)
            ?.map((value) => value.slice(1, -1));
        const applicationCodes = ACTIVITY_SECTORS.map(({ code }) => code);

        expect(databaseCodes).toEqual(applicationCodes);
    });

    it("grants authenticated users access only to the new editable column", () => {
        expect(migrationSql).toMatch(
            /grant\s+update\s*\(activity_sector_code\)\s+on\s+table\s+public\.profiles\s+to\s+authenticated\s*;/i,
        );
        expect(migrationSql).not.toMatch(/grant\s+update\s+on\s+table/i);
    });
});
