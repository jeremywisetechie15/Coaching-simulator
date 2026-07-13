import { NextRequest, NextResponse } from "next/server";
import { updateUserDto } from "@/features/users/dto";
import { updateUser } from "@/features/users/server";
import { jsonError } from "@/lib/server/http";

interface RouteContext {
    params: Promise<{
        userId: string;
    }>;
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
    try {
        const { userId } = await params;
        const input = updateUserDto.parse(await request.json());
        const user = await updateUser(userId, input);

        return NextResponse.json({ user });
    } catch (error) {
        return jsonError(error);
    }
}
