import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migrationSql = readFileSync(
    resolve(
        process.cwd(),
        "supabase/migrations/20260717085528_revoke_archived_group_content_access.sql",
    ),
    "utf8",
);

describe("archived group access privileges", () => {
    it("limits regular member access to active groups", () => {
        const canReadGroupDefinition = migrationSql.match(
            /create\s+or\s+replace\s+function\s+private\.can_read_group\s*\(\s*target_group_id\s+uuid\s*\)[\s\S]+?as\s+\$\$([\s\S]+?)\$\$\s*;/i,
        );

        expect(canReadGroupDefinition).not.toBeNull();
        expect(canReadGroupDefinition?.[1]).toMatch(/\bg\.status\s*=\s*'active'/i);
    });

    it("keeps the helper private and callable by authenticated users", () => {
        expect(migrationSql).toMatch(
            /revoke\s+all\s+on\s+function\s+private\.can_read_group\s*\(\s*uuid\s*\)\s+from\s+public\s*,\s*anon\s*;/i,
        );
        expect(migrationSql).toMatch(
            /grant\s+execute\s+on\s+function\s+private\.can_read_group\s*\(\s*uuid\s*\)\s+to\s+authenticated\s*;/i,
        );
    });
});
