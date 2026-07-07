import { requireAuth } from "@/features/auth/server";
import { NotFoundError } from "@/lib/server/errors";
import { assertHttpUrl } from "@/lib/server/http-url";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

interface MethodResourceAccessRow {
    bucket: string | null;
    external_url: string | null;
    id: string;
    is_active: boolean | null;
    method_id: string;
    path: string | null;
    step_id: string | null;
}

export interface MethodResourceAccess {
    url: string;
}

export async function getMethodResourceAccess(
    methodId: string,
    resourceId: string,
): Promise<MethodResourceAccess> {
    await requireAuth();
    const supabase = await createClient();

    const { data: resource, error } = await supabase
        .from("method_resources")
        .select("id, method_id, step_id, bucket, path, external_url, is_active")
        .eq("method_id", methodId)
        .eq("id", resourceId)
        .eq("is_active", true)
        .is("step_id", null)
        .maybeSingle<MethodResourceAccessRow>();

    if (error) throw error;

    if (!resource) {
        throw new NotFoundError("Ressource complémentaire introuvable.");
    }

    if (resource.external_url) {
        return { url: assertHttpUrl(resource.external_url) };
    }

    if (!resource.bucket || !resource.path) {
        throw new NotFoundError("Ressource complémentaire introuvable.");
    }

    const adminSupabase = createAdminClient();
    const { data: signedUrl, error: signedUrlError } = await adminSupabase.storage
        .from(resource.bucket)
        .createSignedUrl(resource.path, 600);

    if (signedUrlError) throw signedUrlError;

    if (!signedUrl?.signedUrl) {
        throw new NotFoundError("Ressource complémentaire introuvable.");
    }

    return { url: assertHttpUrl(signedUrl.signedUrl) };
}
