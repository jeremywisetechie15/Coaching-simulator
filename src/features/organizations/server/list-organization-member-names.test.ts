import { describe, expect, it, vi } from "vitest";
import { ORGANIZATION_MEMBER_STATUS } from "@/features/organizations/domain/organization-member";
import { listOrganizationMemberNames } from "./list-organization-member-names";

interface RecordedQuery {
    equals: Array<[string, unknown]>;
    inFilters: Array<[string, unknown[]]>;
    notEquals: Array<[string, unknown]>;
    select?: string;
    table: string;
}

function createSupabaseDouble() {
    const recordedQueries: RecordedQuery[] = [];
    const client = {
        from: vi.fn((table: string) => {
            const recorded: RecordedQuery = {
                equals: [],
                inFilters: [],
                notEquals: [],
                table,
            };
            const query = {
                eq: vi.fn((column: string, value: unknown) => {
                    recorded.equals.push([column, value]);
                    return query;
                }),
                in: vi.fn((column: string, values: unknown[]) => {
                    recorded.inFilters.push([column, values]);
                    return query;
                }),
                neq: vi.fn((column: string, value: unknown) => {
                    recorded.notEquals.push([column, value]);
                    return query;
                }),
                returns: vi.fn(async () => {
                    recordedQueries.push(recorded);

                    if (table === "organization_members") {
                        return {
                            data: [
                                { user_id: "user-b" },
                                { user_id: "user-a" },
                                { user_id: "user-a" },
                            ],
                            error: null,
                        };
                    }

                    return {
                        data: [
                            {
                                email: "zoe@example.com",
                                first_name: "Zoé",
                                id: "user-a",
                                last_name: "Martin",
                                name: null,
                            },
                            {
                                email: "adrien@example.com",
                                first_name: "Adrien",
                                id: "user-b",
                                last_name: "Dupont",
                                name: null,
                            },
                        ],
                        error: null,
                    };
                }),
                select: vi.fn((select: string) => {
                    recorded.select = select;
                    return query;
                }),
            };

            return query;
        }),
    };

    return { client, recordedQueries };
}

describe("listOrganizationMemberNames", () => {
    it("returns unique roster names in alphabetical order", async () => {
        const { client, recordedQueries } = createSupabaseDouble();

        await expect(
            listOrganizationMemberNames(client as never, "organization-a"),
        ).resolves.toEqual(["Adrien Dupont", "Zoé Martin"]);

        const membershipsQuery = recordedQueries.find(
            (query) => query.table === "organization_members",
        );
        const profilesQuery = recordedQueries.find((query) => query.table === "profiles");

        expect(membershipsQuery?.equals).toContainEqual([
            "organization_id",
            "organization-a",
        ]);
        expect(membershipsQuery?.notEquals).toContainEqual([
            "status",
            ORGANIZATION_MEMBER_STATUS.removed,
        ]);
        expect(profilesQuery?.inFilters).toContainEqual([
            "id",
            ["user-b", "user-a"],
        ]);
    });
});
