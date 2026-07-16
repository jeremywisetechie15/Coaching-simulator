import type { SupabaseClient } from "@supabase/supabase-js";
import type { ContentStatus } from "@/features/content/domain";
import {
    assertContentDependencyScopes,
    assertContentStatusTransition,
    assertInitialContentStatus,
    CONTENT_DEPENDENCY_KIND,
    type ContentDependencyReference,
} from "@/features/content/server";
import { scorecardVisibilityToScope } from "@/features/scorecards/domain";
import type { SaveScorecardDto } from "@/features/scorecards/dto";
import { assertMethodStepsBelongToMethod } from "./scorecard-method-steps.validation";

export async function assertScorecardLifecycle(
    supabase: SupabaseClient,
    input: SaveScorecardDto,
    currentStatus?: ContentStatus,
) {
    if (currentStatus) {
        assertContentStatusTransition(currentStatus, input.status);
    } else {
        assertInitialContentStatus(input.status);
    }

    await assertMethodStepsBelongToMethod(supabase, input);

    const dependencies: ContentDependencyReference[] = [
        { id: input.methodId, kind: CONTENT_DEPENDENCY_KIND.method },
    ];
    const skillIds = new Set<string>();

    for (const step of input.steps) {
        for (const criterion of step.criteria) {
            if (criterion.competenceId) skillIds.add(criterion.competenceId);
        }
    }

    dependencies.push(...[...skillIds].map((id) => ({ id, kind: CONTENT_DEPENDENCY_KIND.skill })));

    await assertContentDependencyScopes(supabase, input.status, dependencies, {
        organizationId: input.organizationId,
        scope: scorecardVisibilityToScope(input.visibility),
    });
}
