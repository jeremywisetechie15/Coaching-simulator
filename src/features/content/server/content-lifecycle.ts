import type { SupabaseClient } from "@supabase/supabase-js";
import {
    CONTENT_STATUS,
    CONTENT_TRANSITION_BLOCK_CODE,
    CONTENT_VISIBILITY_SCOPE,
    contentAudienceCoversDependency,
    getContentTransitionBlock,
    isSelectableContent,
    type ContentAudience,
    type ContentStatus,
    type ContentVisibilityScope,
} from "@/features/content/domain";
import { ConflictError } from "@/lib/server/errors";

export const CONTENT_DEPENDENCY_KIND = {
    coach: "coach",
    method: "method",
    persona: "persona",
    quiz: "quiz",
    scorecard: "scorecard",
    skill: "skill",
} as const;

export type ContentDependencyKind =
    (typeof CONTENT_DEPENDENCY_KIND)[keyof typeof CONTENT_DEPENDENCY_KIND];

export interface ContentDependencyReference {
    id: string;
    kind: ContentDependencyKind;
    label?: string;
}

interface DependencyRow {
    assigned_user_id?: string | null;
    group_id?: string | null;
    id: string;
    is_active?: boolean | null;
    organization_id?: string | null;
    status?: ContentStatus | null;
    scope?: string | null;
    visibility_scope?: string | null;
}

interface DependencyDefinition {
    defaultLabel: string;
    select: string;
    scopeColumn: "scope" | "visibility_scope";
    table: string;
}

const DEPENDENCY_DEFINITIONS: Record<ContentDependencyKind, DependencyDefinition> = {
    [CONTENT_DEPENDENCY_KIND.coach]: {
        defaultLabel: "le coach associé",
        select: "id, status",
        scopeColumn: "visibility_scope",
        table: "coaches",
    },
    [CONTENT_DEPENDENCY_KIND.method]: {
        defaultLabel: "la méthode associée",
        select: "id, scope, organization_id, status, is_active",
        scopeColumn: "scope",
        table: "methods",
    },
    [CONTENT_DEPENDENCY_KIND.persona]: {
        defaultLabel: "le persona associé",
        select: "id, status",
        scopeColumn: "visibility_scope",
        table: "personas",
    },
    [CONTENT_DEPENDENCY_KIND.quiz]: {
        defaultLabel: "le quiz associé",
        select: "id, visibility_scope, organization_id, group_id, assigned_user_id, status, is_active",
        scopeColumn: "visibility_scope",
        table: "quizzes",
    },
    [CONTENT_DEPENDENCY_KIND.scorecard]: {
        defaultLabel: "la scorecard associée",
        select: "id, visibility_scope, organization_id, status, is_active",
        scopeColumn: "visibility_scope",
        table: "scorecards",
    },
    [CONTENT_DEPENDENCY_KIND.skill]: {
        defaultLabel: "la compétence associée",
        select: "id, visibility_scope, organization_id, group_id, assigned_user_id, status, is_active",
        scopeColumn: "visibility_scope",
        table: "skills",
    },
};

function uniqueReferences(references: ContentDependencyReference[]) {
    return [...new Map(
        references
            .filter((reference) => Boolean(reference.id))
            .map((reference) => [`${reference.kind}:${reference.id}`, reference]),
    ).values()];
}

function dependencyAudience(
    definition: DependencyDefinition,
    row: DependencyRow,
): ContentAudience {
    return {
        groupId: row.group_id,
        organizationId: row.organization_id,
        scope: row[definition.scopeColumn] as ContentVisibilityScope,
        userId: row.assigned_user_id,
    };
}

async function enrichUserAudience(
    supabase: SupabaseClient,
    audience: ContentAudience,
): Promise<ContentAudience> {
    if (audience.scope !== CONTENT_VISIBILITY_SCOPE.user || !audience.userId) {
        return audience;
    }

    const [organizationResult, groupResult] = await Promise.all([
        supabase
            .from("organization_members")
            .select("organization_id")
            .eq("user_id", audience.userId)
            .eq("status", "active"),
        supabase
            .from("group_members")
            .select("group_id")
            .eq("user_id", audience.userId),
    ]);

    if (organizationResult.error) throw organizationResult.error;
    if (groupResult.error) throw groupResult.error;

    return {
        ...audience,
        userGroupIds: (groupResult.data ?? []).flatMap((row: { group_id?: string | null }) =>
            row.group_id ? [row.group_id] : []
        ),
        userOrganizationIds: (organizationResult.data ?? []).flatMap(
            (row: { organization_id?: string | null }) => row.organization_id ? [row.organization_id] : [],
        ),
    };
}

/**
 * Every relation must target a published, active entity. Audience compatibility
 * is additionally enforced when the parent itself is published.
 */
export async function assertContentDependencyScopes(
    supabase: SupabaseClient,
    parentStatus: ContentStatus,
    references: ContentDependencyReference[],
    parentAudience: ContentAudience,
) {
    const unique = uniqueReferences(references);
    if (unique.length === 0) return;

    const resolvedParentAudience = parentStatus === CONTENT_STATUS.published
        ? await enrichUserAudience(supabase, parentAudience)
        : parentAudience;
    const referencesByKind = new Map<ContentDependencyKind, ContentDependencyReference[]>();

    for (const reference of unique) {
        referencesByKind.set(reference.kind, [...(referencesByKind.get(reference.kind) ?? []), reference]);
    }

    const rowsByReference = new Map<string, DependencyRow>();
    await Promise.all([...referencesByKind].map(async ([kind, groupedReferences]) => {
        const definition = DEPENDENCY_DEFINITIONS[kind];
        const { data, error } = await supabase
            .from(definition.table)
            .select(definition.select)
            .in("id", groupedReferences.map((reference) => reference.id));

        if (error) throw error;

        for (const row of (data ?? []) as unknown as DependencyRow[]) {
            rowsByReference.set(`${kind}:${row.id}`, row);
        }
    }));

    for (const reference of unique) {
        const definition = DEPENDENCY_DEFINITIONS[reference.kind];
        const row = rowsByReference.get(`${reference.kind}:${reference.id}`);
        const label = reference.label ?? definition.defaultLabel;

        if (!row) {
            throw new ConflictError(`Impossible d'enregistrer : ${label} est introuvable.`);
        }

        if (!row.status || !isSelectableContent(row.status, row.is_active !== false)) {
            throw new ConflictError(
                `Impossible d'enregistrer : ${label} doit être publié et actif.`,
            );
        }

        if (
            parentStatus === CONTENT_STATUS.published
            && !contentAudienceCoversDependency(resolvedParentAudience, dependencyAudience(definition, row))
        ) {
            throw new ConflictError(
                `Impossible de publier : ${label} n'est pas accessible à tous les destinataires prévus. ` +
                "Vérifiez que sa visibilité correspond à celle du contenu.",
            );
        }
    }
}

export function assertInitialContentStatus(status: ContentStatus) {
    if (status === CONTENT_STATUS.archived) {
        throw new ConflictError("Un contenu ne peut pas être créé directement avec le statut archivé.");
    }
}

export function assertContentStatusTransition(
    currentStatus: ContentStatus,
    nextStatus: ContentStatus,
) {
    const block = getContentTransitionBlock(currentStatus, nextStatus);

    if (block?.code === CONTENT_TRANSITION_BLOCK_CODE.publishedToDraftUnsupported) {
        throw new ConflictError(
            "Un contenu publié ne peut pas repasser en brouillon. Archivez-le lorsqu'il ne doit plus être visible.",
        );
    }

    if (block?.code === CONTENT_TRANSITION_BLOCK_CODE.archivedRestoreUnsupported) {
        throw new ConflictError(
            "Un contenu archivé ne peut pas être restauré. Dupliquez-le pour créer un nouveau brouillon.",
        );
    }
}
