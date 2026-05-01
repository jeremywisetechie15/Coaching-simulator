import { ForbiddenError, UnauthorizedError } from "@/lib/server/errors";
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

    if (context.platformRole !== "admin") {
        throw new ForbiddenError("Accès admin requis.");
    }

    return context;
}
