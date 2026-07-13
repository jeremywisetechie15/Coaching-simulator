import { NextRequest, NextResponse } from "next/server";
import { updateUserStatusDto } from "@/features/users/dto";
import { updateUserStatus } from "@/features/users/server";
import { jsonError } from "@/lib/server/http";

export const dynamic = "force-dynamic";

interface RouteContext {
    params: Promise<{
        userId: string;
    }>;
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
    try {
        const { userId } = await params;
        const input = updateUserStatusDto.parse(await request.json());
        const result = await updateUserStatus(userId, input);

        return NextResponse.json(result);
    } catch (error) {
        return jsonError(error);
    }
}
