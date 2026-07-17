import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migrationSql = readFileSync(
    resolve(
        process.cwd(),
        "supabase/migrations/20260717085539_restrict_organization_deletion_with_members.sql",
    ),
    "utf8",
);

describe("organization membership deletion constraint", () => {
    it("prevents organization deletion from cascading to memberships", () => {
        expect(migrationSql).toMatch(
            /drop\s+constraint\s+if\s+exists\s+organization_members_organization_id_fkey/i,
        );
        expect(migrationSql).toMatch(
            /foreign\s+key\s*\(\s*organization_id\s*\)[\s\S]*references\s+public\.organizations\s*\(\s*id\s*\)[\s\S]*on\s+delete\s+restrict/i,
        );
        expect(migrationSql).not.toMatch(/on\s+delete\s+cascade/i);
    });

    it("cleans only group memberships from the removed user's organization", () => {
        expect(migrationSql).toMatch(
            /create\s+or\s+replace\s+function\s+private\.cleanup_group_members_after_organization_membership_delete\s*\(\s*\)/i,
        );
        expect(migrationSql).toMatch(/security\s+definer/i);
        expect(migrationSql).toMatch(/set\s+search_path\s*=\s*''/i);
        expect(migrationSql).toMatch(
            /revoke\s+all\s+on\s+function\s+private\.cleanup_group_members_after_organization_membership_delete\s*\(\s*\)[\s\S]*from\s+public,\s*anon,\s*authenticated/i,
        );
        expect(migrationSql).toMatch(
            /delete\s+from\s+public\.group_members[\s\S]*using\s+public\.groups/i,
        );
        expect(migrationSql).toContain("group_membership.user_id = old.user_id");
        expect(migrationSql).toContain("organization_group.organization_id = old.organization_id");
        expect(migrationSql).toMatch(
            /create\s+trigger\s+cleanup_group_members_after_organization_membership_delete\s+after\s+delete\s+on\s+public\.organization_members/i,
        );
    });
});
