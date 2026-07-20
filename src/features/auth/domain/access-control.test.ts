import { describe, expect, it } from "vitest";
import {
    APP_NAVIGATION_RESOURCE,
    canAccessAppRoute,
    canManageAppResource,
    canViewAppNavigationResource,
    getAppHomeRoute,
    isPlatformAdmin,
    isSuspendedUserContext,
} from "./access-control";

describe("access-control", () => {
    it("identifies platform admins", () => {
        expect(isPlatformAdmin("admin")).toBe(true);
    });

    it("does not grant admin access to regular users", () => {
        expect(isPlatformAdmin("user")).toBe(false);
        expect(isPlatformAdmin(null)).toBe(false);
        expect(isPlatformAdmin(undefined)).toBe(false);
    });

    it("restricts users, organizations and permissions navigation to platform admins", () => {
        expect(canViewAppNavigationResource("admin", APP_NAVIGATION_RESOURCE.users)).toBe(true);
        expect(canViewAppNavigationResource("admin", APP_NAVIGATION_RESOURCE.organizations)).toBe(true);
        expect(canViewAppNavigationResource("admin", APP_NAVIGATION_RESOURCE.permissions)).toBe(true);
        expect(canViewAppNavigationResource("user", APP_NAVIGATION_RESOURCE.users)).toBe(false);
        expect(canViewAppNavigationResource("user", APP_NAVIGATION_RESOURCE.organizations)).toBe(false);
        expect(canViewAppNavigationResource("user", APP_NAVIGATION_RESOURCE.permissions)).toBe(false);
    });

    it("keeps learner navigation resources visible to regular users", () => {
        expect(canViewAppNavigationResource("user", APP_NAVIGATION_RESOURCE.dashboard)).toBe(true);
        expect(canViewAppNavigationResource("user", APP_NAVIGATION_RESOURCE.roleplays)).toBe(true);
        expect(canViewAppNavigationResource("user", APP_NAVIGATION_RESOURCE.evaluations)).toBe(true);
        expect(canViewAppNavigationResource("user", APP_NAVIGATION_RESOURCE.methods)).toBe(true);
    });

    it("shows the dashboard entry to learners and platform admins", () => {
        expect(canViewAppNavigationResource("user", APP_NAVIGATION_RESOURCE.dashboard)).toBe(true);
        expect(canViewAppNavigationResource("admin", APP_NAVIGATION_RESOURCE.dashboard)).toBe(true);
    });

    it("restricts management actions to platform admins", () => {
        expect(canManageAppResource("admin", APP_NAVIGATION_RESOURCE.methods)).toBe(true);
        expect(canManageAppResource("admin", APP_NAVIGATION_RESOURCE.roleplays)).toBe(true);
        expect(canManageAppResource("user", APP_NAVIGATION_RESOURCE.methods)).toBe(false);
        expect(canManageAppResource("user", APP_NAVIGATION_RESOURCE.roleplays)).toBe(false);
        expect(canManageAppResource("admin", APP_NAVIGATION_RESOURCE.dashboard)).toBe(false);
    });

    it("uses the same rule for direct app routes as navigation entries", () => {
        expect(canAccessAppRoute("admin", APP_NAVIGATION_RESOURCE.users)).toBe(true);
        expect(canAccessAppRoute("user", APP_NAVIGATION_RESOURCE.users)).toBe(false);
        expect(canAccessAppRoute("user", APP_NAVIGATION_RESOURCE.roleplays)).toBe(true);
        expect(canAccessAppRoute("user", APP_NAVIGATION_RESOURCE.dashboard)).toBe(true);
        expect(canAccessAppRoute("admin", APP_NAVIGATION_RESOURCE.dashboard)).toBe(true);
    });

    it("centralizes the temporary home route for each platform role", () => {
        expect(getAppHomeRoute("user")).toBe("/");
        expect(getAppHomeRoute("admin")).toBe("/");
    });

    it("identifies suspended organization users without blocking platform admins", () => {
        const suspendedMembership = {
            organizationId: "org-1",
            role: "member" as const,
            status: "suspended" as const,
        };

        expect(isSuspendedUserContext({
            activeOrganizationId: null,
            activeOrganizationRole: null,
            email: "learner@example.com",
            memberships: [suspendedMembership],
            platformRole: "user",
            userId: "learner-1",
        })).toBe(true);
        expect(isSuspendedUserContext({
            activeOrganizationId: null,
            activeOrganizationRole: null,
            email: "admin@example.com",
            memberships: [suspendedMembership],
            platformRole: "admin",
            userId: "admin-1",
        })).toBe(false);
    });
});
