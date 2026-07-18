import type { createClient } from "@/lib/supabase/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { findEligibleCompletedRoleplaySession } from "./find-eligible-completed-session";

function createSupabaseDouble() {
    const result = {
        data: { id: "session-1", notation_json: { synthese: {} } },
        error: null,
    };
    const query = {
        eq: vi.fn(),
        gte: vi.fn(),
        limit: vi.fn(),
        maybeSingle: vi.fn().mockResolvedValue(result),
        order: vi.fn(),
        select: vi.fn(),
    };
    query.eq.mockReturnValue(query);
    query.gte.mockReturnValue(query);
    query.limit.mockReturnValue(query);
    query.order.mockReturnValue(query);
    query.select.mockReturnValue(query);

    const supabase = {
        from: vi.fn().mockReturnValue(query),
    } as unknown as Awaited<ReturnType<typeof createClient>>;

    return { query, result, supabase };
}

describe("findEligibleCompletedRoleplaySession", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("selects the exact referenced completed session", async () => {
        const { query, result, supabase } = createSupabaseDouble();

        await expect(
            findEligibleCompletedRoleplaySession(supabase, {
                refSessionId: "session-1",
                scenarioId: "scenario-1",
            }),
        ).resolves.toEqual(result);

        expect(query.eq).toHaveBeenCalledWith("scenario_id", "scenario-1");
        expect(query.eq).toHaveBeenCalledWith("status", "completed");
        expect(query.eq).toHaveBeenCalledWith("id", "session-1");
        expect(query.gte).toHaveBeenCalledWith("duration_seconds", 30);
        expect(query.order).not.toHaveBeenCalled();
    });

    it("keeps the existing optional user filter", async () => {
        const { query, supabase } = createSupabaseDouble();

        await findEligibleCompletedRoleplaySession(supabase, {
            refSessionId: "session-1",
            scenarioId: "scenario-1",
            userId: "user-1",
        });

        expect(query.eq).toHaveBeenCalledWith("user_id", "user-1");
    });
});
