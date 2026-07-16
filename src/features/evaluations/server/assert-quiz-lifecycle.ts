import type { SupabaseClient } from "@supabase/supabase-js";
import { CONTENT_STATUS, type ContentStatus } from "@/features/content/domain";
import {
    assertContentDependencyScopes,
    assertContentStatusTransition,
    assertInitialContentStatus,
    CONTENT_DEPENDENCY_KIND,
    type ContentDependencyReference,
} from "@/features/content/server";
import { QUIZ_EVALUATED_DIMENSION } from "@/features/evaluations/domain";
import type { SaveQuizDto } from "@/features/evaluations/dto";
import { ConflictError } from "@/lib/server/errors";

interface QuizKnowledgeSkillRow {
    skill_id: string;
}

export async function assertQuizKnowledgeSkills(
    supabase: SupabaseClient,
    skillIds: string[],
) {
    const uniqueSkillIds = Array.from(new Set(skillIds.filter(Boolean)));
    if (uniqueSkillIds.length === 0) return;

    const { data, error } = await supabase
        .from("skill_dimension_items")
        .select("skill_id")
        .in("skill_id", uniqueSkillIds)
        .eq("dimension", QUIZ_EVALUATED_DIMENSION)
        .eq("is_active", true)
        .returns<QuizKnowledgeSkillRow[]>();

    if (error) throw error;

    const supportedSkillIds = new Set((data ?? []).map((row) => row.skill_id));
    if (uniqueSkillIds.some((skillId) => !supportedSkillIds.has(skillId))) {
        throw new ConflictError(
            "Chaque compétence d'un quiz doit posséder au moins un item Savoir actif.",
        );
    }
}

export async function assertQuizLifecycle(
    supabase: SupabaseClient,
    input: SaveQuizDto,
    currentStatus?: ContentStatus,
) {
    if (currentStatus) {
        assertContentStatusTransition(currentStatus, input.status);
    } else {
        assertInitialContentStatus(input.status);
    }

    const dependencies: ContentDependencyReference[] = [];
    if (input.methodId) dependencies.push({ id: input.methodId, kind: CONTENT_DEPENDENCY_KIND.method });

    const skillIds = new Set<string>();

    for (const step of input.steps) {
        step.competenceIds.forEach((skillId) => skillIds.add(skillId));
        for (const question of step.questions) {
            if (question.competenceId) skillIds.add(question.competenceId);
        }
    }

    dependencies.push(...[...skillIds].map((id) => ({ id, kind: CONTENT_DEPENDENCY_KIND.skill })));

    if (input.status !== CONTENT_STATUS.archived) {
        await assertQuizKnowledgeSkills(supabase, [...skillIds]);
    }
    await assertContentDependencyScopes(supabase, input.status, dependencies, {
        groupId: input.groupId,
        organizationId: input.organizationId,
        scope: input.scope,
        userId: input.assignedUserId,
    });
}
