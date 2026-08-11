import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { ACTIVITY_SECTORS } from "@/features/content/domain";
import {
    PERSONA_PCS_GROUP_CODES,
    PERSONA_SEX_CODES,
} from "@/features/personas/domain/persona-demographics";

const migrationSql = readFileSync(
    new URL(
        "../../../../supabase/migrations/20260811171023_add_persona_demographics_and_activity_sector.sql",
        import.meta.url,
    ),
    "utf8",
);

function extractConstraintValues(column: string) {
    const match = migrationSql.match(
        new RegExp(`${column}\\s+is\\s+null[\\s\\S]+?${column}\\s+in\\s*\\(([\\s\\S]+?)\\)`, "i"),
    );

    return Array.from(match?.[1].matchAll(/'([^']+)'/g) ?? [], ([, value]) => value);
}

describe("persona demographics and activity-sector migration", () => {
    it("adds optional columns without unsafe defaults", () => {
        for (const column of ["sex_code", "pcs_group_code", "activity_sector_code"]) {
            expect(migrationSql).toMatch(new RegExp(`add\\s+column\\s+if\\s+not\\s+exists\\s+${column}\\s+text`, "i"));
            expect(migrationSql).not.toMatch(new RegExp(`${column}\\s+text\\s+not\\s+null`, "i"));
            expect(migrationSql).not.toMatch(new RegExp(`${column}\\s+text\\s+default`, "i"));
        }
    });

    it("uses the application catalogs as the database constraint SSOT", () => {
        expect(extractConstraintValues("sex_code")).toEqual([...PERSONA_SEX_CODES]);
        expect(extractConstraintValues("pcs_group_code")).toEqual([...PERSONA_PCS_GROUP_CODES]);
        expect(extractConstraintValues("activity_sector_code")).toEqual(
            ACTIVITY_SECTORS.map(({ code }) => code),
        );
    });

    it("backfills every legacy persona sector through explicit compatibility rules", () => {
        for (const [legacyLabel, code] of [
            ["Nettoyage industriel", "ADM"],
            ["Restauration", "THR"],
            ["Profession libérale santé", "SAN"],
            ["Technologie", "TIC"],
            ["Services informatiques", "TIC"],
            ["Commerce", "COM"],
            ["Industrie", "IND"],
            ["Conseil", "CST"],
            ["Finance", "BFA"],
            ["Immobilier", "IMM"],
            ["Autre", "SER"],
        ]) {
            expect(migrationSql).toContain(`when '${legacyLabel}' then '${code}'`);
        }
    });
});
