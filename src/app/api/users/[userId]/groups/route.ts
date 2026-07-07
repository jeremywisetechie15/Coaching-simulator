import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "@/lib/server/http";
import { userGroupAssignmentDto } from "@/features/users/dto";
import { assignUserToGroup, listUserGroups, removeUserFromGroup } from "@/features/users/server";

export const dynamic = "force-dynamic";

interface RouteContext {
    params: Promise<{
        userId: string;
    }>;
}

export async function GET(_: NextRequest, { params }: RouteContext) {
    try {
        const { userId } = await params;
        const result = await listUserGroups(userId);

        return NextResponse.json(result);
    } catch (error) {
        return jsonError(error);
    }
}

export async function POST(request: NextRequest, { params }: RouteContext) {
    try {
        const { userId } = await params;
        const body = await request.json();
        const input = userGroupAssignmentDto.parse(body);
        const result = await assignUserToGroup(userId, input);

        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        return jsonError(error);
    }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
    try {
        const { userId } = await params;
        const body = await request.json();
        const input = userGroupAssignmentDto.parse(body);
        const result = await removeUserFromGroup(userId, input);

        return NextResponse.json(result);
    } catch (error) {
        return jsonError(error);
    }
}
