import { ForbiddenError } from "@/lib/server/errors";
import type { UserContext } from "@/features/auth/domain/user-context";
import { hasOrganizationAccess } from "@/features/organizations/domain/organization-access";

export function resolveOrganizationForWrite(
    context: UserContext,
    requestedOrganizationId?: string | null
) {
    if (context.platformRole === "admin") {
        return requestedOrganizationId ?? context.activeOrganizationId;
    }

    const organizationId = requestedOrganizationId ?? context.activeOrganizationId;

    if (!organizationId) {
        throw new ForbiddenError("Aucune organisation associée à cet utilisateur.");
    }

    if (!hasOrganizationAccess(context, organizationId)) {
        throw new ForbiddenError("Organisation non autorisée.");
    }

    return organizationId;
}
