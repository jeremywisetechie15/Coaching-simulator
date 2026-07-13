import { describe, expect, it } from "vitest";
import { PLATFORM_ROLE } from "./users";
import {
    getAvailableUserStatusAction,
    getUserStatusManagementDecision,
    USER_STATUS_ACTION,
} from "./user-status-management";

describe("user status management", () => {
    it("prevents an administrator from suspending their own account", () => {
        expect(getUserStatusManagementDecision({
            actorUserId: "admin-1",
            targetPlatformRole: PLATFORM_ROLE.admin,
            targetUserId: "admin-1",
        })).toEqual({
            allowed: false,
            reason: "Vous ne pouvez pas modifier votre propre statut.",
        });
    });

    it("prevents an administrator from changing another administrator status", () => {
        expect(getUserStatusManagementDecision({
            actorUserId: "admin-1",
            targetPlatformRole: PLATFORM_ROLE.admin,
            targetUserId: "admin-2",
        })).toEqual({
            allowed: false,
            reason: "Le statut d’un administrateur se gère depuis Supabase.",
        });
    });

    it("allows status management for a non-admin target", () => {
        expect(getUserStatusManagementDecision({
            actorUserId: "admin-1",
            targetPlatformRole: PLATFORM_ROLE.user,
            targetUserId: "learner-1",
        })).toEqual({ allowed: true, reason: null });
    });

    it("only exposes actions for active or explicitly suspended users", () => {
        expect(getAvailableUserStatusAction({
            isSuspended: false,
            status: "active",
            targetPlatformRole: PLATFORM_ROLE.user,
        })).toBe(USER_STATUS_ACTION.suspend);
        expect(getAvailableUserStatusAction({
            isSuspended: true,
            status: "inactive",
            targetPlatformRole: PLATFORM_ROLE.user,
        })).toBe(USER_STATUS_ACTION.reactivate);
        expect(getAvailableUserStatusAction({
            isSuspended: false,
            status: "pending",
            targetPlatformRole: PLATFORM_ROLE.user,
        })).toBeNull();
    });
});
