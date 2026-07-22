import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    createAdminClient: vi.fn(),
    createClient: vi.fn(),
    requireAuth: vi.fn(),
}));

vi.mock("@/features/auth/server", () => ({ requireAuth: mocks.requireAuth }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: mocks.createAdminClient }));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.createClient }));

import { POST } from "./route";

function request() {
    return new NextRequest("http://localhost/api/save-session", {
        body: JSON.stringify({
            duration_seconds: 45,
            messages: [{ content: "Bonjour", role: "user", timestamp: "2026-07-22T10:00:00.000Z" }],
            scenario_id: "scenario-a",
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
    });
}

describe("POST /api/save-session", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.requireAuth.mockResolvedValue({ activeOrganizationId: "org-a", userId: "user-a" });
    });

    it("does not create a session for a roleplay hidden by authenticated RLS", async () => {
        const scenarioQuery = {
            eq: vi.fn(),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            select: vi.fn(),
        };
        scenarioQuery.select.mockReturnValue(scenarioQuery);
        scenarioQuery.eq.mockReturnValue(scenarioQuery);
        mocks.createClient.mockResolvedValue({ from: vi.fn(() => scenarioQuery) });

        const response = await POST(request());
        const payload = await response.json();

        expect(response.status).toBe(404);
        expect(payload.code).toBe("NOT_FOUND");
        expect(mocks.createAdminClient).not.toHaveBeenCalled();
    });
});
