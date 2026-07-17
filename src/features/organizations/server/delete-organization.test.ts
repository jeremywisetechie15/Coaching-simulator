import { beforeEach, describe, expect, it, vi } from "vitest";
import {
    ORGANIZATION_MEMBERS_REMOVAL_MESSAGE,
    ORGANIZATION_REMOVAL_ACTION,
} from "@/features/organizations/domain/organization-deletion";

const mocks = vi.hoisted(() => ({
    createAdminClient: vi.fn(),
    requireAdmin: vi.fn(),
}));

vi.mock("@/features/auth/server", () => ({ requireAdmin: mocks.requireAdmin }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: mocks.createAdminClient }));

import { removeOrganization } from "./delete-organization";

interface QueryResult {
    count?: number | null;
    data?: unknown;
    error: unknown;
}

interface QueryDouble {
    delete: ReturnType<typeof vi.fn>;
    eq: ReturnType<typeof vi.fn>;
    in: ReturnType<typeof vi.fn>;
    maybeSingle: ReturnType<typeof vi.fn>;
    returns: ReturnType<typeof vi.fn>;
    select: ReturnType<typeof vi.fn>;
    then: Promise<QueryResult>["then"];
    update: ReturnType<typeof vi.fn>;
}

function createQueryDouble(result: QueryResult): QueryDouble {
    const query = {} as QueryDouble;

    query.delete = vi.fn(() => query);
    query.eq = vi.fn(() => query);
    query.in = vi.fn(() => query);
    query.maybeSingle = vi.fn().mockResolvedValue(result);
    query.returns = vi.fn().mockResolvedValue(result);
    query.select = vi.fn(() => query);
    query.then = (onFulfilled, onRejected) => Promise.resolve(result).then(onFulfilled, onRejected);
    query.update = vi.fn(() => query);

    return query;
}

function createUsageClient({
    members = [],
    sessionCount = 0,
}: {
    members?: Array<{ user_id: string }>;
    sessionCount?: number;
}) {
    const queriesByTable = new Map<string, QueryDouble[]>([
        ["organizations", [createQueryDouble({ data: { id: "organization-1" }, error: null })]],
        ["organization_members", [createQueryDouble({ data: members, error: null })]],
        ["groups", [createQueryDouble({ data: [], error: null })]],
        [
            "scenarios",
            [
                createQueryDouble({ count: 0, error: null }),
                createQueryDouble({ count: 0, error: null }),
            ],
        ],
        ["sessions", [createQueryDouble({ count: sessionCount, error: null })]],
        ["methods", [createQueryDouble({ count: 0, error: null })]],
        ["quizzes", [createQueryDouble({ count: 0, error: null })]],
        ["scorecards", [createQueryDouble({ count: 0, error: null })]],
        ["skills", [createQueryDouble({ count: 0, error: null })]],
    ]);
    const from = vi.fn((table: string) => {
        const query = queriesByTable.get(table)?.shift();

        if (!query) {
            throw new Error(`Unexpected query for ${table}`);
        }

        return query;
    });

    return { from };
}

function createMembershipCountClient(count: number) {
    const query = createQueryDouble({ count, error: null });

    return {
        from: vi.fn((table: string) => {
            if (table !== "organization_members") {
                throw new Error(`Unexpected query for ${table}`);
            }

            return query;
        }),
        query,
    };
}

function createDeactivationClient() {
    const query = createQueryDouble({ data: { id: "organization-1" }, error: null });

    return {
        from: vi.fn((table: string) => {
            if (table !== "organizations") {
                throw new Error(`Unexpected query for ${table}`);
            }

            return query;
        }),
        query,
    };
}

describe("removeOrganization", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.requireAdmin.mockResolvedValue({ userId: "admin-1" });
    });

    it("refuses a permanent deletion while members remain", async () => {
        mocks.createAdminClient.mockReturnValueOnce(createUsageClient({
            members: [{ user_id: "user-1" }],
        }));

        await expect(removeOrganization("organization-1")).rejects.toMatchObject({
            code: "CONFLICT",
            message: ORGANIZATION_MEMBERS_REMOVAL_MESSAGE,
            status: 409,
        });

        expect(mocks.createAdminClient).toHaveBeenCalledOnce();
    });

    it("rechecks memberships immediately before the permanent deletion", async () => {
        const membershipCountClient = createMembershipCountClient(1);
        mocks.createAdminClient
            .mockReturnValueOnce(createUsageClient({}))
            .mockReturnValueOnce(membershipCountClient);

        await expect(removeOrganization("organization-1")).rejects.toMatchObject({
            code: "CONFLICT",
            message: ORGANIZATION_MEMBERS_REMOVAL_MESSAGE,
            status: 409,
        });

        expect(membershipCountClient.query.delete).not.toHaveBeenCalled();
        expect(mocks.createAdminClient).toHaveBeenCalledTimes(2);
    });

    it("keeps the non-destructive deactivation available when history exists", async () => {
        const deactivationClient = createDeactivationClient();
        mocks.createAdminClient
            .mockReturnValueOnce(createUsageClient({
                members: [{ user_id: "user-1" }],
                sessionCount: 1,
            }))
            .mockReturnValueOnce(deactivationClient);

        await expect(removeOrganization("organization-1")).resolves.toEqual({
            action: ORGANIZATION_REMOVAL_ACTION.deactivate,
            organizationId: "organization-1",
        });

        expect(deactivationClient.query.update).toHaveBeenCalledOnce();
    });
});
