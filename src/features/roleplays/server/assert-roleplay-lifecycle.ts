import type { SupabaseClient } from "@supabase/supabase-js";
import type { ContentStatus } from "@/features/content/domain";
import {
    assertContentDependencyScopes,
    assertContentStatusTransition,
    assertInitialContentStatus,
    CONTENT_DEPENDENCY_KIND,
    type ContentDependencyReference,
} from "@/features/content/server";
import type { SaveRoleplayDto } from "@/features/roleplays/dto";

export async function assertRoleplayLifecycle(
    supabase: SupabaseClient,
    input: SaveRoleplayDto,
    currentStatus?: ContentStatus,
) {
    if (currentStatus) {
        assertContentStatusTransition(currentStatus, input.status);
    } else {
        assertInitialContentStatus(input.status);
    }

    const dependencies: ContentDependencyReference[] = [];
    if (input.methodId) dependencies.push({ id: input.methodId, kind: CONTENT_DEPENDENCY_KIND.method });
    if (input.scorecardId) dependencies.push({ id: input.scorecardId, kind: CONTENT_DEPENDENCY_KIND.scorecard });
    dependencies.push(...input.quizIds.map((id) => ({ id, kind: CONTENT_DEPENDENCY_KIND.quiz })));

    await assertContentDependencyScopes(supabase, input.status, dependencies, {
        groupId: input.groupId,
        organizationId: input.organizationId,
        scope: input.scope,
        userId: input.assignedUserId,
    });
}
