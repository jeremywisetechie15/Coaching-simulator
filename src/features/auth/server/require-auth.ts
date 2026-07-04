import { ForbiddenError, UnauthorizedError } from "@/lib/server/errors";
import { isPlatformAdmin } from "@/features/auth/domain/access-control";
import { getCurrentUserContext } from "./get-current-user-context";

export async function requireAuth() {
    const context = await getCurrentUserContext();

    if (!context) {
        throw new UnauthorizedError();
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
