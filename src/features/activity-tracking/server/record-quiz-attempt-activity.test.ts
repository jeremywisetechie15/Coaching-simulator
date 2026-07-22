import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    createAdminClient: vi.fn(),
    eq: vi.fn(),
    maybeSingle: vi.fn(),
    requireAuth: vi.fn(),
    select: vi.fn(),
    update: vi.fn(),
}));

vi.mock("@/features/auth/server", () => ({ requireAuth: mocks.requireAuth }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: mocks.createAdminClient }));

import { recordQuizAttemptActivity } from "./record-quiz-attempt-activity";

describe("recordQuizAttemptActivity", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        const query = {
            eq: mocks.eq,
            maybeSingle: mocks.maybeSingle,
            select: mocks.select,
            update: mocks.update,
        };
        mocks.eq.mockReturnValue(query);
        mocks.select.mockReturnValue(query);
        mocks.update.mockReturnValue(query);
        mocks.createAdminClient.mockReturnValue({ from: vi.fn(() => query) });
        mocks.requireAuth.mockResolvedValue({ activeOrganizationId: "org-a", userId: "user-a" });
    });

    it("scopes the attempt to its authenticated owner and snapshots the organization", async () => {
        mocks.maybeSingle.mockResolvedValue({
            data: {
                active_duration_seconds: 10,
                last_activity_at: null,
                organization_id: null,
                status: "in_progress",
            },
            error: null,
        });
        mocks.eq.mockImplementation(() => ({
            eq: mocks.eq,
            maybeSingle: mocks.maybeSingle,
            select: mocks.select,
            update: mocks.update,
            then: (resolve: (value: { error: null }) => unknown) => resolve({ error: null }),
        }));

        await expect(recordQuizAttemptActivity(
            "quiz-a",
            "attempt-a",
            { activeSeconds: 30, aiMessageDelta: 0, userMessageDelta: 0 },
        )).resolves.toMatchObject({ acceptedSeconds: 30, activeDurationSeconds: 40 });

        expect(mocks.eq).toHaveBeenCalledWith("user_id", "user-a");
        expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({
            active_duration_seconds: 40,
            organization_id: "org-a",
        }));
    });

    it("does not update an attempt that is not owned by the authenticated learner", async () => {
        mocks.maybeSingle.mockResolvedValue({ data: null, error: null });

        await expect(recordQuizAttemptActivity(
            "quiz-a",
            "attempt-a",
            { activeSeconds: 30, aiMessageDelta: 0, userMessageDelta: 0 },
        )).rejects.toThrow("Tentative de quiz introuvable");
        expect(mocks.update).not.toHaveBeenCalled();
    });
});
