import { describe, expect, it } from "vitest";
import { ConflictError } from "@/lib/server/errors";
import { getRoleplayPersonaContext } from "./get-roleplay-coach-context";

function createScenarioClient(row: Record<string, unknown>) {
    return {
        from(table: string) {
            if (table !== "scenarios") {
                throw new Error(`Unexpected table ${table}`);
            }

            const query = {
                eq() {
                    return query;
                },
                maybeSingle: async () => ({ data: row, error: null }),
                select() {
                    return query;
                },
            };

            return query;
        },
    };
}

describe("roleplay runtime context availability", () => {
    it("maps the stable sector code to its human label for AI contexts", async () => {
        const client = createScenarioClient({
            activity_sector_code: "TIC",
            id: "scenario-1",
            is_active: true,
            persona_id: null,
            status: "published",
            title: "Prospection numérique",
        });

        const context = await getRoleplayPersonaContext(client as never, "scenario-1");

        expect(context.scenario.activitySector).toBe(
            "Informatique, numérique et télécommunications",
        );
    });

    it.each([
        { is_active: true, status: "draft" },
        { is_active: true, status: "archived" },
        { is_active: false, status: "published" },
    ])("rejects a roleplay that is not published and active", async (availability) => {
        const client = createScenarioClient({
            id: "scenario-1",
            ...availability,
        });

        await expect(
            getRoleplayPersonaContext(client as never, "scenario-1"),
        ).rejects.toThrow(ConflictError);
    });
});
