import { createAdminClient } from "@/lib/supabase/admin";
import { listOrganizationContentScope } from "./list-organization-content-scope";

export {
    resolveBatchRoleplayDerivedQuizAssignments,
} from "./resolve-batch-roleplay-derived-quiz-assignments";

export interface OrganizationUserAssignmentCounts {
    quizCount: number;
    roleplayCount: number;
}

export type OrganizationUserAssignmentCountContext =
    | {
          kind: "organization";
          organizationId: string;
          userIds: string[];
      }
    | {
          groupId: string;
          kind: "group";
          organizationId: string;
          userIds: string[];
      };

function uniqueValues(values: string[]) {
    return Array.from(new Set(values.filter(Boolean)));
}

export async function listOrganizationUserAssignmentCounts(
    supabase: ReturnType<typeof createAdminClient>,
    context: OrganizationUserAssignmentCountContext,
): Promise<Map<string, OrganizationUserAssignmentCounts>> {
    const userIds = uniqueValues(context.userIds);

    if (userIds.length === 0) {
        return new Map();
    }

    const scope = await listOrganizationContentScope(supabase, [context.organizationId]);
    const roleplayIdsByUserId = context.kind === "group"
        ? scope.roleplayIdsByGroupUserId.get(context.groupId)
        : scope.roleplayIdsByOrganizationUserId.get(context.organizationId);
    const quizIdsByUserId = context.kind === "group"
        ? scope.quizIdsByGroupUserId.get(context.groupId)
        : scope.quizIdsByOrganizationUserId.get(context.organizationId);

    return new Map(
        userIds.map((userId) => [
            userId,
            {
                quizCount: quizIdsByUserId?.get(userId)?.size ?? 0,
                roleplayCount: roleplayIdsByUserId?.get(userId)?.size ?? 0,
            },
        ]),
    );
}
