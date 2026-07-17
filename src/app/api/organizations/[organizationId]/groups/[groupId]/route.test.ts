import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    archiveOrganizationGroup: vi.fn(),
    getOrganizationGroupDetail: vi.fn(),
    updateOrganizationGroup: vi.fn(),
}));

vi.mock("@/features/organizations/server", () => mocks);

import { DELETE, PATCH } from "./route";

const context = {
    params: Promise.resolve({
        groupId: "group-1",
        organizationId: "organization-1",
    }),
};

describe("organization group detail route", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("updates a group with the shared DTO", async () => {
        const updatedGroup = {
            id: "group-1",
            name: "Équipe France",
        };
        mocks.updateOrganizationGroup.mockResolvedValue(updatedGroup);

        const response = await PATCH(
            new NextRequest("http://localhost/api/organizations/organization-1/groups/group-1", {
                body: JSON.stringify({
                    description: "  Groupe commercial  ",
                    name: "  Équipe France  ",
                }),
                headers: { "Content-Type": "application/json" },
                method: "PATCH",
            }),
            context,
        );

        expect(mocks.updateOrganizationGroup).toHaveBeenCalledWith(
            "organization-1",
            "group-1",
            {
                description: "Groupe commercial",
                name: "Équipe France",
            },
        );
        expect(response.status).toBe(200);
        await expect(response.json()).resolves.toEqual({ group: updatedGroup });
    });

    it("archives the selected group", async () => {
        mocks.archiveOrganizationGroup.mockResolvedValue(undefined);

        const response = await DELETE(
            new NextRequest("http://localhost/api/organizations/organization-1/groups/group-1", {
                method: "DELETE",
            }),
            context,
        );

        expect(mocks.archiveOrganizationGroup).toHaveBeenCalledWith(
            "organization-1",
            "group-1",
        );
        expect(response.status).toBe(200);
        await expect(response.json()).resolves.toEqual({ ok: true });
    });
});
