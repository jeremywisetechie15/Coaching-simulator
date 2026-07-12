import { describe, expect, it } from "vitest";
import { resolveRoleplayCoachId } from "./resolve-roleplay-coach-id";

function createFakeSupabase(scenarioCoachId: string | null) {
    return {
        from(table: string) {
            expect(table).toBe("scenarios");
            return {
                select(column: string) {
                    expect(column).toBe("coach_id");
                    const builder = {
                        eq(filterColumn: string, scenarioId: string) {
                            expect(filterColumn).toBe("id");
                            expect(scenarioId).toBe("scenario-1");
                            return builder;
                        },
                        maybeSingle: async () => ({
                            data: { coach_id: scenarioCoachId },
                            error: null,
                        }),
                    };

                    return builder;
                },
            };
        },
    };
}

describe("resolveRoleplayCoachId", () => {
    it("keeps an explicit coach override", async () => {
        await expect(resolveRoleplayCoachId({} as never, {
            explicitCoachId: "coach-explicit",
            fallbackCoachId: "coach-default",
            scenarioId: "scenario-1",
        })).resolves.toBe("coach-explicit");
    });

    it("uses the coach associated with the scenario before the fallback", async () => {
        await expect(resolveRoleplayCoachId(createFakeSupabase("coach-scenario") as never, {
            fallbackCoachId: "coach-default",
            scenarioId: "scenario-1",
        })).resolves.toBe("coach-scenario");
    });

    it("uses the default coach only when the scenario has no coach", async () => {
        await expect(resolveRoleplayCoachId(createFakeSupabase(null) as never, {
            fallbackCoachId: "coach-default",
            scenarioId: "scenario-1",
        })).resolves.toBe("coach-default");
    });
});
