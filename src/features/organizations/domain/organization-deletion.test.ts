import { describe, expect, it } from "vitest";
import {
    getOrganizationRemovalAction,
    ORGANIZATION_REMOVAL_ACTION,
} from "./organization-deletion";

describe("organization removal", () => {
    it("deactivates an organization when roleplay data must be preserved", () => {
        expect(getOrganizationRemovalAction({
            hasAssociatedContent: true,
            hasAssociatedRoleplay: true,
            hasSessionHistory: true,
        })).toBe(ORGANIZATION_REMOVAL_ACTION.deactivate);
    });

    it("deactivates an organization when session history exists", () => {
        expect(getOrganizationRemovalAction({
            hasAssociatedContent: false,
            hasAssociatedRoleplay: false,
            hasSessionHistory: true,
        })).toBe(ORGANIZATION_REMOVAL_ACTION.deactivate);
    });

    it("deactivates an organization when content must be preserved", () => {
        expect(getOrganizationRemovalAction({
            hasAssociatedContent: true,
            hasAssociatedRoleplay: false,
            hasSessionHistory: false,
        })).toBe(ORGANIZATION_REMOVAL_ACTION.deactivate);
    });

    it("deletes an organization without dependencies", () => {
        expect(getOrganizationRemovalAction({
            hasAssociatedContent: false,
            hasAssociatedRoleplay: false,
            hasSessionHistory: false,
        })).toBe(ORGANIZATION_REMOVAL_ACTION.delete);
    });
});
