import { beforeEach, describe, expect, it, vi } from "vitest";
import { PERSONA_CV_UPLOAD_BUCKET } from "@/lib/uploads/content-upload";

const mocks = vi.hoisted(() => ({
    removeContent: vi.fn(),
}));

vi.mock("@/features/content/server", () => ({
    removeContent: mocks.removeContent,
}));

import { removePersona } from "./archive-persona";

function createSingleQuery(data: unknown) {
    const query = {
        eq: vi.fn(),
        maybeSingle: vi.fn(async () => ({ data, error: null })),
        select: vi.fn(),
    };

    query.eq.mockReturnValue(query);
    query.select.mockReturnValue(query);
    return query;
}

describe("removePersona", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.removeContent.mockResolvedValue("delete");
    });

    it("loads CV storage metadata from the canonical persona table", async () => {
        await removePersona("persona-1");

        const options = mocks.removeContent.mock.calls[0]?.[0] as {
            loadStorageObjects: (
                supabase: { from: (table: string) => ReturnType<typeof createSingleQuery> },
                personaId: string,
            ) => Promise<Array<{ bucket: string; path: string }>>;
        };
        const from = vi.fn((table: string) => table === "personas"
            ? createSingleQuery({ avatar_url: null })
            : createSingleQuery({ storage_path: "personas/persona-1/cv/document.pdf" }));

        await expect(options.loadStorageObjects({ from }, "persona-1")).resolves.toEqual([
            {
                bucket: PERSONA_CV_UPLOAD_BUCKET,
                path: "personas/persona-1/cv/document.pdf",
            },
        ]);
        expect(from).toHaveBeenNthCalledWith(1, "personas");
        expect(from).toHaveBeenNthCalledWith(2, "persona_cv_documents");
    });
});
