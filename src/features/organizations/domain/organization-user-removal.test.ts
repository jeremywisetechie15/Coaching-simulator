import { describe, expect, it } from "vitest";
import type {
    OrganizationDetail,
    OrganizationUserRow,
} from "./organization-detail";
import {
    decrementOrganizationUserCount,
    removeOrganizationUserRow,
} from "./organization-user-removal";

const organization = {
    contactEmail: "contact@example.com",
    createdAt: "2026-07-17T00:00:00.000Z",
    groupCount: 1,
    id: "organization-1",
    industry: "Formation",
    name: "Organisation",
    phone: "",
    programCount: 0,
    region: "France",
    status: "active",
    userCount: 2,
} satisfies OrganizationDetail;

const users = [
    { id: "user-1" },
    { id: "user-2" },
] as OrganizationUserRow[];

describe("organization user removal state", () => {
    it("removes only the targeted organization user row", () => {
        expect(removeOrganizationUserRow(users, "user-1")).toEqual([{ id: "user-2" }]);
    });

    it("decrements the organization count without mutating the source", () => {
        expect(decrementOrganizationUserCount(organization)).toMatchObject({ userCount: 1 });
        expect(organization.userCount).toBe(2);
    });

    it("never produces a negative organization user count", () => {
        expect(decrementOrganizationUserCount({ ...organization, userCount: 0 }).userCount).toBe(0);
    });
});
