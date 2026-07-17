import { describe, expect, it } from "vitest";
import {
    getOrganizationGroupDetailHref,
    getOrganizationGroupsHref,
} from "./organization-navigation";

describe("organization navigation", () => {
    it("builds the groups tab href", () => {
        expect(getOrganizationGroupsHref("organization-1")).toBe(
            "/organizations/organization-1?tab=groups",
        );
    });

    it("builds group view and edit hrefs from one contract", () => {
        expect(getOrganizationGroupDetailHref("organization-1", "group-1")).toBe(
            "/organizations/organization-1/groups/group-1",
        );
        expect(getOrganizationGroupDetailHref("organization-1", "group-1", { edit: true })).toBe(
            "/organizations/organization-1/groups/group-1?edit=1",
        );
        expect(getOrganizationGroupDetailHref("organization-1", "group-1", { tab: "members" })).toBe(
            "/organizations/organization-1/groups/group-1?tab=members",
        );
    });

    it("encodes organization and group identifiers", () => {
        expect(getOrganizationGroupDetailHref("organization/1", "group?1", { edit: true })).toBe(
            "/organizations/organization%2F1/groups/group%3F1?edit=1",
        );
    });
});
