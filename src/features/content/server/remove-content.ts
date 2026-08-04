import type { SupabaseClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/features/auth/server";
import {
    CONTENT_REMOVAL_ACTION,
    CONTENT_STATUS,
    getContentRemovalAction,
    type ContentRemovalAction,
    type ContentStatus,
} from "@/features/content/domain";
import { ConflictError, NotFoundError } from "@/lib/server/errors";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertContentStatusTransition } from "./content-lifecycle";

export interface ContentDependencyCheck {
    column: string;
    table: string;
}

export interface ContentStorageObject {
    bucket: string;
    path: string;
}

interface RemoveContentOptions {
    archiveChanges?: Record<string, unknown>;
    dependencyChecks?: readonly ContentDependencyCheck[];
    entityId: string;
    entityLabel: string;
    loadStorageObjects?: (
        supabase: SupabaseClient,
        entityId: string,
    ) => Promise<ContentStorageObject[]>;
    table: string;
}

async function assertDraftHasNoDependencies(
    supabase: SupabaseClient,
    entityId: string,
    dependencyChecks: readonly ContentDependencyCheck[],
    entityLabel: string,
) {
    const checks = await Promise.all(
        dependencyChecks.map(async ({ column, table }) => {
            const { count, error } = await supabase
                .from(table)
                .select("*", { count: "exact", head: true })
                .eq(column, entityId);

            if (error) throw error;
            return (count ?? 0) > 0;
        }),
    );

    if (checks.some(Boolean)) {
        throw new ConflictError(
            `${entityLabel} est déjà lié à un autre contenu et ne peut pas être supprimé.`,
        );
    }
}

async function cleanupStorageObjects(
    supabase: SupabaseClient,
    storageObjects: ContentStorageObject[],
) {
    const pathsByBucket = new Map<string, Set<string>>();

    for (const { bucket, path } of storageObjects) {
        if (!bucket.trim() || !path.trim()) continue;
        const paths = pathsByBucket.get(bucket) ?? new Set<string>();
        paths.add(path);
        pathsByBucket.set(bucket, paths);
    }

    for (const [bucket, paths] of pathsByBucket) {
        const { error } = await supabase.storage.from(bucket).remove([...paths]);
        if (error) {
            console.warn("Impossible de nettoyer un fichier lié au brouillon supprimé.", error);
        }
    }
}

export async function removeContent({
    archiveChanges = {},
    dependencyChecks = [],
    entityId,
    entityLabel,
    loadStorageObjects,
    table,
}: RemoveContentOptions): Promise<ContentRemovalAction> {
    await requireAdmin();
    const adminSupabase = createAdminClient();
    const { data: existing, error: existingError } = await adminSupabase
        .from(table)
        .select("status")
        .eq("id", entityId)
        .maybeSingle<{ status: ContentStatus }>();

    if (existingError) throw existingError;
    if (!existing) throw new NotFoundError(`${entityLabel} introuvable.`);

    const action = getContentRemovalAction(existing.status);
    if (!action) {
        throw new ConflictError(`${entityLabel} est déjà archivé.`);
    }

    if (action === CONTENT_REMOVAL_ACTION.delete) {
        await assertDraftHasNoDependencies(
            adminSupabase,
            entityId,
            dependencyChecks,
            entityLabel,
        );
        const storageObjects = loadStorageObjects
            ? await loadStorageObjects(adminSupabase, entityId)
            : [];
        const { data, error } = await adminSupabase
            .from(table)
            .delete()
            .eq("id", entityId)
            .eq("status", CONTENT_STATUS.draft)
            .select("id")
            .maybeSingle<{ id: string }>();

        if (error?.code === "23503") {
            throw new ConflictError(
                `${entityLabel} est déjà lié à un autre contenu et ne peut pas être supprimé.`,
            );
        }
        if (error) throw error;
        if (!data) {
            throw new ConflictError(
                `Le statut de ${entityLabel.toLocaleLowerCase("fr-FR")} a changé. Actualisez la page.`,
            );
        }

        await cleanupStorageObjects(adminSupabase, storageObjects);
        return action;
    }

    assertContentStatusTransition(existing.status, CONTENT_STATUS.archived);

    const { data, error } = await adminSupabase
        .from(table)
        .update({
            ...archiveChanges,
            status: CONTENT_STATUS.archived,
            updated_at: new Date().toISOString(),
        })
        .eq("id", entityId)
        .eq("status", CONTENT_STATUS.published)
        .select("id")
        .maybeSingle<{ id: string }>();

    if (error) throw error;
    if (!data) {
        throw new ConflictError(
            `Le statut de ${entityLabel.toLocaleLowerCase("fr-FR")} a changé. Actualisez la page.`,
        );
    }

    return action;
}
