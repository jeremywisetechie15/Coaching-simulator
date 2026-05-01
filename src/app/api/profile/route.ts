import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "@/lib/server/http";
import { updateProfileDto } from "@/features/profile/dto/update-profile.dto";
import { updateCurrentProfile } from "@/features/profile/server";

export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const input = updateProfileDto.parse(body);
        const profile = await updateCurrentProfile(input);

        return NextResponse.json({ profile });
    } catch (error) {
        return jsonError(error);
    }
}
