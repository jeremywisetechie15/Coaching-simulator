import type { SaveRoleplayDto } from "@/features/roleplays/dto";

export const ROLEPLAY_SELECT =
    "id, title, description, preview_title, preview_description, persona_id, coach_id, method_id, scorecard_id, coaching_steps, difficulty_level, created_by, notation_method_id, status, domain, category, disc_profile, context, objective, obstacles, visibility_scope, organization_id, group_id, assigned_user_id, is_active, created_at, updated_at";

export const SCENARIO_QUIZ_SELECT = "scenario_id, quiz_id, sort_order, participation";
export const SCENARIO_RESOURCE_SELECT =
    "id, scenario_id, bucket, path, label, resource_type, external_url, sort_order, is_active";

export function nullableText(value: string | null | undefined) {
    const trimmed = value?.trim() ?? "";
    return trimmed.length > 0 ? trimmed : null;
}

function buildCoachingSteps(input: SaveRoleplayDto) {
    return [
        input.context ? `Contexte : ${input.context}` : "",
        input.objective ? `Objectif : ${input.objective}` : "",
        input.obstacles ? `Freins et objections : ${input.obstacles}` : "",
    ]
        .filter(Boolean)
        .join("\n\n");
}

function createRoleplayBasePayload(input: SaveRoleplayDto, notationMethodId: string | null) {
    return {
        assigned_user_id: input.scope === "user" ? input.assignedUserId : null,
        category: nullableText(input.category),
        coach_id: input.coachId,
        coaching_steps: nullableText(buildCoachingSteps(input)),
        context: nullableText(input.context),
        description: nullableText(input.description),
        difficulty_level: input.difficulty,
        disc_profile: input.disc,
        domain: nullableText(input.domain),
        group_id: input.scope === "group" ? input.groupId : null,
        is_active: input.status !== "archived",
        method_id: input.methodId,
        notation_method_id: notationMethodId,
        objective: nullableText(input.objective),
        obstacles: nullableText(input.obstacles),
        organization_id:
            input.scope === "organization" || input.scope === "group" ? input.organizationId : null,
        persona_id: input.personaId,
        preview_description: nullableText(input.previewDescription),
        preview_title: nullableText(input.previewTitle),
        scorecard_id: input.scorecardId,
        status: input.status,
        title: input.title,
        updated_at: new Date().toISOString(),
        visibility_scope: input.scope,
    };
}

export function createRoleplayInsert(input: SaveRoleplayDto, createdBy: string, notationMethodId: string | null) {
    const now = new Date().toISOString();

    return {
        ...createRoleplayBasePayload(input, notationMethodId),
        created_at: now,
        created_by: createdBy,
        updated_at: now,
    };
}

export function createRoleplayUpdate(input: SaveRoleplayDto, notationMethodId: string | null) {
    return createRoleplayBasePayload(input, notationMethodId);
}

export function createScenarioQuizRows(scenarioId: string, input: SaveRoleplayDto) {
    return input.quizIds.map((quizId, index) => ({
        participation: input.quizParticipation,
        quiz_id: quizId,
        scenario_id: scenarioId,
        sort_order: index + 1,
    }));
}

function hasResourceLocation(resource: SaveRoleplayDto["resources"][number]) {
    return (
        resource.externalUrl.trim().length > 0 ||
        resource.clientFileId.trim().length > 0 ||
        (resource.storageBucket.trim().length > 0 && resource.storagePath.trim().length > 0)
    );
}

export function createScenarioResourceRows(scenarioId: string, input: SaveRoleplayDto) {
    return input.resources.filter(hasResourceLocation).map((resource, index) => {
        const externalUrl = nullableText(resource.externalUrl);
        const storageBucket = nullableText(resource.storageBucket);
        const storagePath = nullableText(resource.storagePath);
        const label = resource.label || externalUrl || storagePath || "Ressource";

        return {
            ...(resource.id ? { id: resource.id } : {}),
            bucket: storageBucket,
            external_url: externalUrl,
            is_active: true,
            label,
            path: storagePath,
            resource_type: resource.resourceType || (externalUrl ? "link" : "document"),
            scenario_id: scenarioId,
            sort_order: index + 1,
        };
    });
}
