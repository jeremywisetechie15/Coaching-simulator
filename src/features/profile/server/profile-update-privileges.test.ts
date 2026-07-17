import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migrationSql = readFileSync(
    resolve(
        process.cwd(),
        "supabase/migrations/20260717071140_harden_profile_update_privileges.sql",
    ),
    "utf8",
);

const editableProfileColumns = [
    "name",
    "first_name",
    "last_name",
    "bio",
    "avatar_path",
    "updated_at",
];

describe("profile update privileges migration", () => {
    it("replaces authenticated table-wide updates with the profile field allowlist", () => {
        expect(migrationSql).toMatch(
            /revoke\s+update\s+on\s+table\s+public\.profiles\s+from\s+authenticated\s*;/i,
        );

        const grant = migrationSql.match(
            /grant\s+update\s*\(([^)]+)\)\s+on\s+table\s+public\.profiles\s+to\s+authenticated\s*;/i,
        );

        expect(grant).not.toBeNull();
        const grantedColumns = grant?.[1]
            .split(",")
            .map((column) => column.trim())
            .filter(Boolean);

        expect(grantedColumns).toEqual(editableProfileColumns);
        expect(grantedColumns).not.toContain("id");
        expect(grantedColumns).not.toContain("email");
        expect(grantedColumns).not.toContain("platform_role");
        expect(grantedColumns).not.toContain("created_at");
    });

    it("does not restrict administrative service-role writes", () => {
        expect(migrationSql).not.toMatch(/revoke[^;]+from\s+service_role\s*;/i);
    });
});
