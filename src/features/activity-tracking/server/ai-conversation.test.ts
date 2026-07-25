import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    createAdminClient: vi.fn(),
    insert: vi.fn(),
    requireAuth: vi.fn(),
    select: vi.fn(),
    single: vi.fn(),
}));

vi.mock("@/features/auth/server", () => ({ requireAuth: mocks.requireAuth }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: mocks.createAdminClient }));

import { createAiConversation } from "./ai-conversation";

describe("createAiConversation", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        const query = {
            insert: mocks.insert,
            select: mocks.select,
            single: mocks.single,
        };
        mocks.insert.mockReturnValue(query);
        mocks.select.mockReturnValue(query);
        mocks.single.mockResolvedValue({ data: { id: "conversation-a" }, error: null });
        mocks.createAdminClient.mockReturnValue({ from: vi.fn(() => query) });
        mocks.requireAuth.mockResolvedValue({
            activeOrganizationId: "organization-a",
            userId: "user-a",
        });
    });

    it("persists the exact roleplay coach mode with the secured usage snapshot", async () => {
        await expect(createAiConversation({
            coachMode: "feedback",
            interactionType: "coach",
        })).resolves.toEqual({ id: "conversation-a" });

        expect(mocks.insert).toHaveBeenCalledWith({
            coach_mode: "feedback",
            interaction_type: "coach",
            last_activity_at: expect.any(String),
            organization_id: "organization-a",
            user_id: "user-a",
        });
    });

    it("keeps the coach mode empty for Ask Persona", async () => {
        await createAiConversation({ interactionType: "ask_persona" });

        expect(mocks.insert).toHaveBeenCalledWith(expect.objectContaining({
            coach_mode: null,
            interaction_type: "ask_persona",
        }));
    });
});
