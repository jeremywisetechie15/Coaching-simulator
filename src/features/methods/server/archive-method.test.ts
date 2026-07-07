import { describe, expect, it } from "vitest";
import { ConflictError } from "@/lib/server/errors";
import { assertMethodCanBeArchived } from "./archive-method";

function createFakeSupabase(scenarios: Array<{ id: string; method_id: string | null }>) {
    return {
        from(table: string) {
            if (table !== "scenarios") {
                throw new Error(`Unexpected table ${table}`);
            }

            return {
                select() {
                    let methodId: string | null = null;

                    const builder = {
                        eq(column: string, value: string) {
                            if (column !== "method_id") {
                                throw new Error(`Unexpected column ${column}`);
                            }
                            methodId = value;
                            return builder;
                        },
                        limit() {
                            return builder;
                        },
                        maybeSingle: async () => ({
                            data: scenarios.find((scenario) => scenario.method_id === methodId) ?? null,
                            error: null,
                        }),
                    };

                    return builder;
                },
            };
        },
    };
}

describe("assertMethodCanBeArchived", () => {
    it("rejects methods used by a scenario", async () => {
        const supabase = createFakeSupabase([{ id: "scenario-1", method_id: "method-1" }]);

        await expect(assertMethodCanBeArchived(supabase as never, "method-1")).rejects.toThrow(ConflictError);
    });

    it("allows methods without scenario usage", async () => {
        const supabase = createFakeSupabase([{ id: "scenario-1", method_id: "method-2" }]);

        await expect(assertMethodCanBeArchived(supabase as never, "method-1")).resolves.toBeUndefined();
    });
});
