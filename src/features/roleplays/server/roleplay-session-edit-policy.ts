import type { SupabaseClient } from "@supabase/supabase-js";
import {
    hasRoleplaySessionLockedConfigurationChanged,
    ROLEPLAY_SESSION_EDIT_RESTRICTION_MESSAGE,
    type RoleplaySessionLockedConfiguration,
} from "@/features/roleplays/domain";
import type { SaveRoleplayDto } from "@/features/roleplays/dto";
import { ConflictError, NotFoundError } from "@/lib/server/errors";
import {
    createScenarioResourceRows,
    nullableText,
    SCENARIO_QUIZ_SELECT,
    SCENARIO_RESOURCE_SELECT,
} from "./roleplay.persistence";

interface LockedScenarioRow {
    assigned_user_id: string | null;
    background_image_path: string | null;
    category: string | null;
    coach_id: string | null;
    difficulty_level: string | null;
    disc_profile: string;
    domain: string | null;
    group_id: string | null;
    method_id: string | null;
    organization_id: string | null;
    persona_id: string | null;
    scorecard_id: string | null;
    visibility_scope: string;
}

interface LockedScenarioQuizRow {
    participation: string;
    quiz_id: string;
    sort_order: number;
}

interface LockedScenarioResourceRow {
    bucket: string | null;
    id: string;
    is_active: boolean;
    path: string | null;
    resource_type: string;
    sort_order: number;
}

interface RoleplaySessionEditOptions {
    hasBackgroundUpload?: boolean;
    hasResourceUploads?: boolean;
}

const LOCKED_SCENARIO_SELECT = [
    "assigned_user_id",
    "background_image_path",
    "category",
    "coach_id",
    "difficulty_level",
    "disc_profile",
    "domain",
    "group_id",
    "method_id",
    "organization_id",
    "persona_id",
    "scorecard_id",
    "visibility_scope",
].join(", ");

function currentConfiguration(
    scenario: LockedScenarioRow,
    quizzes: LockedScenarioQuizRow[],
    resources: LockedScenarioResourceRow[],
): RoleplaySessionLockedConfiguration {
    return {
        assignedUserId: scenario.assigned_user_id,
        backgroundImagePath: scenario.background_image_path,
        category: scenario.category,
        coachId: scenario.coach_id,
        difficulty: scenario.difficulty_level,
        disc: scenario.disc_profile,
        domain: scenario.domain,
        groupId: scenario.group_id,
        methodId: scenario.method_id,
        organizationId: scenario.organization_id,
        personaId: scenario.persona_id,
        quizzes: quizzes.map((quiz) => ({
            id: quiz.quiz_id,
            participation: quiz.participation,
        })),
        resources: resources.map((resource) => ({
            id: resource.id,
            resourceType: resource.resource_type,
            storageBucket: resource.bucket,
            storagePath: resource.path,
        })),
        scope: scenario.visibility_scope,
        scorecardId: scenario.scorecard_id,
    };
}

function nextConfiguration(
    roleplayId: string,
    input: SaveRoleplayDto,
): RoleplaySessionLockedConfiguration {
    return {
        assignedUserId: input.scope === "user" ? input.assignedUserId : null,
        backgroundImagePath: nullableText(input.backgroundImagePath),
        category: nullableText(input.category),
        coachId: input.coachId,
        difficulty: input.difficulty,
        disc: input.disc,
        domain: nullableText(input.domain),
        groupId: input.scope === "group" ? input.groupId : null,
        methodId: input.methodId,
        organizationId:
            input.scope === "organization" || input.scope === "group"
                ? input.organizationId
                : null,
        personaId: input.personaId,
        quizzes: input.quizIds.map((id) => ({
            id,
            participation: input.quizParticipation,
        })),
        resources: createScenarioResourceRows(roleplayId, input).map((resource) => ({
            id: resource.id ?? null,
            resourceType: resource.resource_type,
            storageBucket: resource.bucket,
            storagePath: resource.path,
        })),
        scope: input.scope,
        scorecardId: input.scorecardId,
    };
}

export async function hasRoleplaySessions(
    supabase: SupabaseClient,
    roleplayId: string,
) {
    const { count, error } = await supabase
        .from("sessions")
        .select("id", { count: "exact", head: true })
        .eq("scenario_id", roleplayId);

    if (error) throw error;

    return (count ?? 0) > 0;
}

export async function assertRoleplaySessionEditPolicy(
    supabase: SupabaseClient,
    roleplayId: string,
    input: SaveRoleplayDto,
    {
        hasBackgroundUpload = false,
        hasResourceUploads = false,
    }: RoleplaySessionEditOptions = {},
) {
    if (!(await hasRoleplaySessions(supabase, roleplayId))) return;

    const [scenarioResult, quizzesResult, resourcesResult] = await Promise.all([
        supabase
            .from("scenarios")
            .select(LOCKED_SCENARIO_SELECT)
            .eq("id", roleplayId)
            .maybeSingle<LockedScenarioRow>(),
        supabase
            .from("scenario_quizzes")
            .select(SCENARIO_QUIZ_SELECT)
            .eq("scenario_id", roleplayId)
            .order("sort_order", { ascending: true })
            .returns<LockedScenarioQuizRow[]>(),
        supabase
            .from("scenario_resources")
            .select(SCENARIO_RESOURCE_SELECT)
            .eq("scenario_id", roleplayId)
            .eq("is_active", true)
            .order("sort_order", { ascending: true })
            .returns<LockedScenarioResourceRow[]>(),
    ]);

    if (scenarioResult.error) throw scenarioResult.error;
    if (quizzesResult.error) throw quizzesResult.error;
    if (resourcesResult.error) throw resourcesResult.error;
    if (!scenarioResult.data) throw new NotFoundError("Roleplay introuvable.");

    const configurationChanged = hasRoleplaySessionLockedConfigurationChanged(
        currentConfiguration(
            scenarioResult.data,
            quizzesResult.data ?? [],
            resourcesResult.data ?? [],
        ),
        nextConfiguration(roleplayId, input),
    );

    if (
        configurationChanged ||
        hasBackgroundUpload ||
        hasResourceUploads
    ) {
        throw new ConflictError(ROLEPLAY_SESSION_EDIT_RESTRICTION_MESSAGE);
    }
}
