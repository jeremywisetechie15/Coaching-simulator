import { PLATFORM_ROLE, type PlatformRole } from "@/features/users/domain/users";

export const APP_NAVIGATION_RESOURCE = {
    coaches: "coaches",
    dashboard: "dashboard",
    evaluations: "evaluations",
    methods: "methods",
    organizations: "organizations",
    personas: "personas",
    roleplays: "roleplays",
    scorecards: "scorecards",
    skills: "skills",
    users: "users",
} as const;

export type AppNavigationResource =
    (typeof APP_NAVIGATION_RESOURCE)[keyof typeof APP_NAVIGATION_RESOURCE];

const ADMIN_ONLY_APP_NAVIGATION_RESOURCES = new Set<AppNavigationResource>([
    APP_NAVIGATION_RESOURCE.organizations,
    APP_NAVIGATION_RESOURCE.users,
]);

const ADMIN_MANAGED_APP_RESOURCES = new Set<AppNavigationResource>([
    APP_NAVIGATION_RESOURCE.coaches,
    APP_NAVIGATION_RESOURCE.evaluations,
    APP_NAVIGATION_RESOURCE.methods,
    APP_NAVIGATION_RESOURCE.organizations,
    APP_NAVIGATION_RESOURCE.personas,
    APP_NAVIGATION_RESOURCE.roleplays,
    APP_NAVIGATION_RESOURCE.scorecards,
    APP_NAVIGATION_RESOURCE.skills,
    APP_NAVIGATION_RESOURCE.users,
]);

export function isPlatformAdmin(platformRole: PlatformRole | null | undefined): boolean {
    return platformRole === PLATFORM_ROLE.admin;
}

export function canViewAppNavigationResource(
    platformRole: PlatformRole | null | undefined,
    resource: AppNavigationResource,
): boolean {
    if (!ADMIN_ONLY_APP_NAVIGATION_RESOURCES.has(resource)) {
        return true;
    }

    return isPlatformAdmin(platformRole);
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
