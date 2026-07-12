import { describe, expect, it } from "vitest";
import { ConflictError } from "@/lib/server/errors";
import { assertNotUsedByPublishedRoleplay } from "./assert-not-used-by-published-roleplay";

interface ScenarioFixture {
    coach_id?: string | null;
    id: string;
    persona_id?: string | null;
    status: string;
}

function createFakeSupabase(scenarios: ScenarioFixture[]) {
    return {
        from(table: string) {
            if (table !== "scenarios") throw new Error(`Unexpected table ${table}`);

            return {
                select() {
                    const filters = new Map<string, string>();
                    const builder = {
                        eq(column: string, value: string) {
                            filters.set(column, value);
                            return builder;
                        },
                        limit() {
                            return builder;
                        },
                        maybeSingle: async () => ({
                            data: scenarios.find((scenario) =>
                                [...filters].every(([column, value]) =>
                                    scenario[column as keyof ScenarioFixture] === value
                                ),
                            ) ?? null,
                            error: null,
                        }),
                    };

                    return builder;
                },
            };
        },
    };
}

describe("assertNotUsedByPublishedRoleplay", () => {
    it("blocks an entity referenced by a published roleplay", async () => {
        const supabase = createFakeSupabase([
            { id: "scenario-1", persona_id: "persona-1", status: "published" },
        ]);

        await expect(assertNotUsedByPublishedRoleplay(supabase as never, {
            column: "persona_id",
            entityId: "persona-1",
            entityLabel: "ce persona",
        })).rejects.toThrow(ConflictError);
    });

    it("allows an entity referenced only by a draft roleplay", async () => {
        const supabase = createFakeSupabase([
            { coach_id: "coach-1", id: "scenario-1", status: "draft" },
        ]);

        await expect(assertNotUsedByPublishedRoleplay(supabase as never, {
            column: "coach_id",
            entityId: "coach-1",
            entityLabel: "ce coach",
        })).resolves.toBeUndefined();
    });
});
