import type { UserContext } from "@/features/auth/domain/user-context";
import type { SaveMethodDto } from "@/features/methods/dto/save-method.dto";
import { resolveOrganizationForWrite } from "@/features/organizations/server/resolve-organization-for-write";

export function normalizeMethodScopeForWrite(
    context: UserContext,
    input: SaveMethodDto,
): SaveMethodDto {
    if (input.scope !== "organization") {
        return {
            ...input,
            organizationId: null,
            scope: "public",
        };
    }

    return {
        ...input,
        organizationId: resolveOrganizationForWrite(context, input.organizationId),
        scope: "organization",
    };
}
