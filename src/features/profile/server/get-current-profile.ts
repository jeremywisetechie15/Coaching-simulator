import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAuth } from "@/features/auth/server";
import type { ProfileView } from "@/features/profile/domain/profile";
import { mapProfileRowToView, type ProfileRow } from "./profile.mapper";

const profileSelect = "email, name, first_name, last_name, bio, avatar_path";

export async function getCurrentProfile(): Promise<ProfileView> {
    const context = await requireAuth();
    const supabase = await createClient();

    const { data: profile, error } = await supabase
        .from("profiles")
        .select(profileSelect)
        .eq("id", context.userId)
        .maybeSingle<ProfileRow>();

    if (error) {
        throw error;
    }

    if (!profile) {
        const adminSupabase = createAdminClient();
        const { data: existingProfile, error: existingProfileError } = await adminSupabase
            .from("profiles")
            .select(profileSelect)
            .eq("id", context.userId)
            .maybeSingle<ProfileRow>();

        if (existingProfileError) {
            throw existingProfileError;
        }

        if (existingProfile) {
            return mapProfileRowToView(existingProfile, context.email);
        }

        const { data: createdProfile, error: createError } = await adminSupabase
            .from("profiles")
            .insert({
                id: context.userId,
                email: context.email,
                platform_role: "user",
            })
            .select(profileSelect)
            .single<ProfileRow>();

        if (createError) {
            throw createError;
        }

        return mapProfileRowToView(createdProfile, context.email);
    }

    return mapProfileRowToView(profile, context.email);
}
