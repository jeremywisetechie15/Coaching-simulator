import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    createAdminClient: vi.fn(),
    messagesInsert: vi.fn(),
    requireAuth: vi.fn(),
}));

vi.mock("@/features/auth/server", () => ({ requireAuth: mocks.requireAuth }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: mocks.createAdminClient }));

import { POST } from "./route";

function request() {
    return new NextRequest("http://localhost/api/update-session", {
        body: JSON.stringify({
            duration_seconds: 45,
            messages: [{ content: "Bonjour", role: "user", timestamp: "2026-07-22T10:00:00.000Z" }],
            session_id: "session-a",
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
    });
}

describe("POST /api/update-session", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.requireAuth.mockResolvedValue({ activeOrganizationId: "org-a", userId: "user-a" });
    });

    it("cannot append messages to a session owned by another learner", async () => {
        const sessionQuery = {
            eq: vi.fn(),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            select: vi.fn(),
            update: vi.fn(),
        };
        sessionQuery.update.mockReturnValue(sessionQuery);
        sessionQuery.eq.mockReturnValue(sessionQuery);
        sessionQuery.select.mockReturnValue(sessionQuery);
        mocks.createAdminClient.mockReturnValue({
            from: vi.fn((table: string) => table === "messages"
                ? { insert: mocks.messagesInsert }
                : sessionQuery),
        });

        const response = await POST(request());
        const payload = await response.json();

        expect(response.status).toBe(404);
        expect(payload.code).toBe("NOT_FOUND");
        expect(mocks.messagesInsert).not.toHaveBeenCalled();
        expect(sessionQuery.eq).toHaveBeenCalledWith("user_id", "user-a");
    });
});
