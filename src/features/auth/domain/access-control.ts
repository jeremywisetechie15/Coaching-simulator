import { PLATFORM_ROLE, type PlatformRole } from "@/features/users/domain/users";
import { ORGANIZATION_MEMBER_STATUS } from "@/features/organizations/domain/organization-member";
import type { UserContext } from "./user-context";

export const APP_NAVIGATION_RESOURCE = {
    coaches: "coaches",
    dashboard: "dashboard",
    evaluations: "evaluations",
    methods: "methods",
    organizations: "organizations",
    permissions: "permissions",
    personas: "personas",
    roleplays: "roleplays",
    scorecards: "scorecards",
    skills: "skills",
    users: "users",
} as const;

export type AppNavigationResource =
    (typeof APP_NAVIGATION_RESOURCE)[keyof typeof APP_NAVIGATION_RESOURCE];

export const APP_HOME_ROUTE_BY_PLATFORM_ROLE = {
    [PLATFORM_ROLE.admin]: "/",
    [PLATFORM_ROLE.user]: "/",
} as const satisfies Record<PlatformRole, string>;

const ADMIN_ONLY_APP_NAVIGATION_RESOURCES = new Set<AppNavigationResource>([
    APP_NAVIGATION_RESOURCE.organizations,
    APP_NAVIGATION_RESOURCE.permissions,
    APP_NAVIGATION_RESOURCE.users,
]);

const ADMIN_MANAGED_APP_RESOURCES = new Set<AppNavigationResource>([
    APP_NAVIGATION_RESOURCE.coaches,
    APP_NAVIGATION_RESOURCE.evaluations,
    APP_NAVIGATION_RESOURCE.methods,
    APP_NAVIGATION_RESOURCE.organizations,
    APP_NAVIGATION_RESOURCE.permissions,
    APP_NAVIGATION_RESOURCE.personas,
    APP_NAVIGATION_RESOURCE.roleplays,
    APP_NAVIGATION_RESOURCE.scorecards,
    APP_NAVIGATION_RESOURCE.skills,
    APP_NAVIGATION_RESOURCE.users,
]);

export function isPlatformAdmin(platformRole: PlatformRole | null | undefined): boolean {
    return platformRole === PLATFORM_ROLE.admin;
}

export function isSuspendedUserContext(context: UserContext) {
    if (isPlatformAdmin(context.platformRole)) return false;

    const hasActiveMembership = context.memberships.some(
        (membership) => membership.status === ORGANIZATION_MEMBER_STATUS.active,
    );
    const hasSuspendedMembership = context.memberships.some(
        (membership) => membership.status === ORGANIZATION_MEMBER_STATUS.suspended,
    );

    return !hasActiveMembership && hasSuspendedMembership;
}

export function canViewAppNavigationResource(
    platformRole: PlatformRole | null | undefined,
    resource: AppNavigationResource,
): boolean {
    if (ADMIN_ONLY_APP_NAVIGATION_RESOURCES.has(resource)) {
        return isPlatformAdmin(platformRole);
    }

    return true;
}

export function canAccessAppRoute(
    platformRole: PlatformRole | null | undefined,
    resource: AppNavigationResource,
): boolean {
    return canViewAppNavigationResource(platformRole, resource);
}

export function canManageAppResource(
    platformRole: PlatformRole | null | undefined,
    resource: AppNavigationResource,
): boolean {
    return ADMIN_MANAGED_APP_RESOURCES.has(resource) && isPlatformAdmin(platformRole);
}

export function getAppHomeRoute(platformRole: PlatformRole): string {
    return APP_HOME_ROUTE_BY_PLATFORM_ROLE[platformRole];
}
