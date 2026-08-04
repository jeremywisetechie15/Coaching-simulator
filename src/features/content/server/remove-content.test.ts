import { beforeEach, describe, expect, it, vi } from "vitest";
import { CONTENT_REMOVAL_ACTION, CONTENT_STATUS } from "@/features/content/domain";

const mocks = vi.hoisted(() => ({
    createAdminClient: vi.fn(),
    requireAdmin: vi.fn(),
}));

vi.mock("@/features/auth/server", () => ({
    requireAdmin: mocks.requireAdmin,
}));

vi.mock("@/lib/supabase/admin", () => ({
    createAdminClient: mocks.createAdminClient,
}));

import { removeContent } from "./remove-content";

interface QueryResult {
    count?: number | null;
    data?: unknown;
    error?: null | { code?: string; message: string };
}

function createQuery(result: QueryResult) {
    const resolvedResult = {
        count: result.count ?? null,
        data: result.data ?? null,
        error: result.error ?? null,
    };
    const query = {
        delete: vi.fn(),
        eq: vi.fn(),
        maybeSingle: vi.fn(async () => resolvedResult),
        select: vi.fn(),
        then: (
            resolve: (value: typeof resolvedResult) => unknown,
            reject?: (reason: unknown) => unknown,
        ) => Promise.resolve(resolvedResult).then(resolve, reject),
        update: vi.fn(),
    };

    query.delete.mockReturnValue(query);
    query.eq.mockReturnValue(query);
    query.select.mockReturnValue(query);
    query.update.mockReturnValue(query);

    return query;
}

describe("removeContent", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.requireAdmin.mockResolvedValue({ id: "admin-id" });
    });

    it("deletes an unused draft instead of archiving it", async () => {
        const statusQuery = createQuery({
            data: { status: CONTENT_STATUS.draft },
        });
        const deleteQuery = createQuery({ data: { id: "draft-id" } });
        const from = vi.fn()
            .mockReturnValueOnce(statusQuery)
            .mockReturnValueOnce(deleteQuery);

        mocks.createAdminClient.mockReturnValue({ from });

        await expect(removeContent({
            entityId: "draft-id",
            entityLabel: "Méthode",
            table: "methods",
        })).resolves.toBe(CONTENT_REMOVAL_ACTION.delete);

        expect(deleteQuery.delete).toHaveBeenCalledOnce();
        expect(deleteQuery.update).not.toHaveBeenCalled();
        expect(deleteQuery.eq).toHaveBeenCalledWith("status", CONTENT_STATUS.draft);
    });

    it("archives published content instead of deleting it", async () => {
        const statusQuery = createQuery({
            data: { status: CONTENT_STATUS.published },
        });
        const updateQuery = createQuery({ data: { id: "published-id" } });
        const from = vi.fn()
            .mockReturnValueOnce(statusQuery)
            .mockReturnValueOnce(updateQuery);

        mocks.createAdminClient.mockReturnValue({ from });

        await expect(removeContent({
            archiveChanges: { is_active: false },
            entityId: "published-id",
            entityLabel: "Quiz",
            table: "quizzes",
        })).resolves.toBe(CONTENT_REMOVAL_ACTION.archive);

        expect(updateQuery.update).toHaveBeenCalledWith(expect.objectContaining({
            is_active: false,
            status: CONTENT_STATUS.archived,
        }));
        expect(updateQuery.delete).not.toHaveBeenCalled();
        expect(updateQuery.eq).toHaveBeenCalledWith("status", CONTENT_STATUS.published);
    });

    it("refuses to delete a draft referenced by another entity", async () => {
        const statusQuery = createQuery({
            data: { status: CONTENT_STATUS.draft },
        });
        const dependencyQuery = createQuery({ count: 1 });
        const from = vi.fn()
            .mockReturnValueOnce(statusQuery)
            .mockReturnValueOnce(dependencyQuery);

        mocks.createAdminClient.mockReturnValue({ from });

        await expect(removeContent({
            dependencyChecks: [{ column: "method_id", table: "scorecards" }],
            entityId: "draft-id",
            entityLabel: "Méthode",
            table: "methods",
        })).rejects.toThrow("est déjà lié à un autre contenu");

        expect(from).toHaveBeenCalledTimes(2);
        expect(dependencyQuery.delete).not.toHaveBeenCalled();
    });
});
