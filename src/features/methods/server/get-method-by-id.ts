import { requireAuth } from "@/features/auth/server";
import type { MethodDetail } from "@/features/methods/domain/method";
import { NotFoundError } from "@/lib/server/errors";
import { createClient } from "@/lib/supabase/server";
import {
    mapMethodRowsToDetail,
    type MethodResourceRow,
    type MethodRow,
    type MethodStepRow,
} from "./method.mapper";
import { withMethodOrganizationNames } from "./method-organization-names";
import { METHOD_RESOURCE_SELECT, METHOD_SELECT, METHOD_STEP_SELECT } from "./method.persistence";

export async function getMethodById(methodId: string): Promise<MethodDetail> {
    await requireAuth();
    const supabase = await createClient();

    const { data: methodRow, error } = await supabase
        .from("methods")
        .select(METHOD_SELECT)
        .eq("id", methodId)
        .maybeSingle<MethodRow>();

    if (error) {
        throw error;
    }

    if (!methodRow) {
        throw new NotFoundError("Méthode introuvable.");
    }

    const [{ data: stepRows, error: stepsError }, { data: resourceRows, error: resourcesError }] =
        await Promise.all([
            supabase
                .from("method_steps")
                .select(METHOD_STEP_SELECT)
                .eq("method_id", methodId)
                .order("step_order", { ascending: true }),
            supabase
                .from("method_resources")
                .select(METHOD_RESOURCE_SELECT)
                .eq("method_id", methodId)
                .eq("is_active", true)
                .order("sort_order", { ascending: true }),
        ]);

    if (stepsError) {
        throw stepsError;
    }

    if (resourcesError) {
        throw resourcesError;
    }

    const [methodWithOrganizationName] = await withMethodOrganizationNames([methodRow]);

    return mapMethodRowsToDetail(
        methodWithOrganizationName,
        (stepRows ?? []) as MethodStepRow[],
        (resourceRows ?? []) as MethodResourceRow[],
    );
}
