import { NotFoundError } from "@/lib/server/errors";
import { assertHttpUrl } from "@/lib/server/http-url";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

interface ScenarioResourceAccessRow {
    bucket: string | null;
    external_url: string | null;
    id: string;
    is_active: boolean | null;
    path: string | null;
    scenario_id: string;
}

export interface RoleplayResourceAccess {
    url: string;
}

export async function getRoleplayResourceAccess(
    roleplayId: string,
    resourceId: string,
): Promise<RoleplayResourceAccess> {
    const supabase = await createClient();
    const { data: resource, error } = await supabase
        .from("scenario_resources")
        .select("id, scenario_id, bucket, path, external_url, is_active")
        .eq("scenario_id", roleplayId)
        .eq("id", resourceId)
        .eq("is_active", true)
        .maybeSingle<ScenarioResourceAccessRow>();

    if (error) throw error;

    if (!resource) {
        throw new NotFoundError("Ressource de préparation introuvable.");
    }

    if (resource.external_url) {
        return { url: assertHttpUrl(resource.external_url) };
    }

    if (!resource.bucket || !resource.path) {
        throw new NotFoundError("Ressource de préparation introuvable.");
    }

    const adminSupabase = createAdminClient();
    const { data: signedUrl, error: signedUrlError } = await adminSupabase.storage
        .from(resource.bucket)
        .createSignedUrl(resource.path, 600);

    if (signedUrlError) throw signedUrlError;

    if (!signedUrl?.signedUrl) {
        throw new NotFoundError("Ressource de préparation introuvable.");
    }

    return { url: assertHttpUrl(signedUrl.signedUrl) };
}
