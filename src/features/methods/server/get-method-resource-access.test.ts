import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    createAdminClient: vi.fn(),
    createClient: vi.fn(),
    requireAuth: vi.fn(),
}));

vi.mock("@/features/auth/server", () => ({ requireAuth: mocks.requireAuth }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: mocks.createAdminClient }));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.createClient }));

import { getMethodResourceAccess } from "./get-method-resource-access";

function createResourceQuery(resource: Record<string, unknown> | null) {
    const query = {
        eq: vi.fn(),
        maybeSingle: vi.fn().mockResolvedValue({ data: resource, error: null }),
        select: vi.fn(),
    };
    query.select.mockReturnValue(query);
    query.eq.mockReturnValue(query);

    return query;
}

describe("getMethodResourceAccess", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.requireAuth.mockResolvedValue({ userId: "user-1" });
    });

    it("creates a signed URL for an uploaded step video", async () => {
        const query = createResourceQuery({
            bucket: "notation_pdf",
            external_url: null,
            id: "resource-1",
            is_active: true,
            method_id: "method-1",
            path: "methods/method-1/steps/step-1/resources/resource-1/video.mp4",
            step_id: "step-1",
        });
        const createSignedUrl = vi.fn().mockResolvedValue({
            data: { signedUrl: "https://project.supabase.co/storage/v1/object/sign/notation_pdf/video.mp4?token=signed" },
            error: null,
        });
        mocks.createClient.mockResolvedValue({ from: vi.fn().mockReturnValue(query) });
        mocks.createAdminClient.mockReturnValue({
            storage: { from: vi.fn().mockReturnValue({ createSignedUrl }) },
        });

        await expect(getMethodResourceAccess("method-1", "resource-1")).resolves.toEqual({
            url: "https://project.supabase.co/storage/v1/object/sign/notation_pdf/video.mp4?token=signed",
        });
        expect(createSignedUrl).toHaveBeenCalledWith(
            "methods/method-1/steps/step-1/resources/resource-1/video.mp4",
            600,
        );
    });

    it("returns an external video URL without signing storage", async () => {
        const query = createResourceQuery({
            bucket: null,
            external_url: "https://example.com/video",
            id: "resource-1",
            is_active: true,
            method_id: "method-1",
            path: null,
            step_id: "step-1",
        });
        mocks.createClient.mockResolvedValue({ from: vi.fn().mockReturnValue(query) });

        await expect(getMethodResourceAccess("method-1", "resource-1")).resolves.toEqual({
            url: "https://example.com/video",
        });
        expect(mocks.createAdminClient).not.toHaveBeenCalled();
    });
});
