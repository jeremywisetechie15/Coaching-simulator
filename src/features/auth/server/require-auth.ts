import { ForbiddenError, UnauthorizedError } from "@/lib/server/errors";
import { isPlatformAdmin, isSuspendedUserContext } from "@/features/auth/domain/access-control";
import { PLATFORM_ROLE } from "@/features/users/domain/users";
import { getCurrentUserContext } from "./get-current-user-context";

export async function requireAuth() {
    const context = await getCurrentUserContext();

    if (!context) {
        throw new UnauthorizedError();
    }

    if (isSuspendedUserContext(context)) {
        throw new ForbiddenError("Compte suspendu.");
    }

    return context;
}

export async function requireAdmin() {
    const context = await requireAuth();

    if (!isPlatformAdmin(context.platformRole)) {
        throw new ForbiddenError("Accès admin requis.");
    }

    return context;
}

export async function requirePlatformUser() {
    const context = await requireAuth();

    if (context.platformRole !== PLATFORM_ROLE.user) {
        throw new ForbiddenError("Accès utilisateur requis.");
    }

    return context;
}
