import type { SupabaseClient } from "@supabase/supabase-js";
import type { ContentStatus } from "@/features/content/domain";
import {
    assertContentDependencyScopes,
    assertContentStatusTransition,
    assertInitialContentStatus,
    CONTENT_DEPENDENCY_KIND,
} from "@/features/content/server";
import type { SaveMethodDto } from "@/features/methods/dto/save-method.dto";

export async function assertMethodLifecycle(
    supabase: SupabaseClient,
    input: SaveMethodDto,
    currentStatus?: ContentStatus,
) {
    if (currentStatus) {
        assertContentStatusTransition(currentStatus, input.status);
    } else {
        assertInitialContentStatus(input.status);
    }

    await assertContentDependencyScopes(
        supabase,
        input.status,
        input.quizId
            ? [{ id: input.quizId, kind: CONTENT_DEPENDENCY_KIND.quiz, label: "quiz associé" }]
            : [],
        {
            organizationId: input.organizationId,
            scope: input.scope,
        },
    );
}
