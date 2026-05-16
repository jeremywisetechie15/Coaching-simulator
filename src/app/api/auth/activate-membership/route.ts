import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { jsonError } from "@/lib/server/http";
import { AppError, UnauthorizedError } from "@/lib/server/errors";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const activateMembershipDto = z.object({
    organizationId: z.string().trim().uuid().optional(),
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json().catch(() => ({}));
        const input = activateMembershipDto.parse(body);
        const supabase = await createClient();

        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
            throw new UnauthorizedError();
        }

        const adminSupabase = createAdminClient();
        let updateQuery = adminSupabase
            .from("organization_members")
            .update({
                status: "active",
                updated_at: new Date().toISOString(),
            })
            .eq("user_id", user.id)
            .eq("status", "invited");

        if (input.organizationId) {
            updateQuery = updateQuery.eq("organization_id", input.organizationId);
        }

        const { data: activatedMemberships, error } = await updateQuery.select("organization_id");

        if (error) {
            throw error;
        }

        const activatedCount = activatedMemberships?.length ?? 0;

        if (input.organizationId && activatedCount === 0) {
            throw new AppError("Invitation introuvable ou déjà activée.", 404, "INVITATION_NOT_FOUND");
        }

        return NextResponse.json({ activated: activatedCount });
    } catch (error) {
        return jsonError(error);
    }
}
