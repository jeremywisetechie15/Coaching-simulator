import { NextRequest, NextResponse } from "next/server";
import {
    userContentAssignmentDto,
    userContentAssignmentParamsDto,
} from "@/features/users/dto";
import {
    assignRoleplayToUser,
    listAssignableRoleplays,
    listUserAssignedQuizzes,
    listUserAssignedRoleplays,
    removeRoleplayUserAssignment,
} from "@/features/users/server";
import { jsonError } from "@/lib/server/http";

export const dynamic = "force-dynamic";

interface RouteContext {
    params: Promise<{ userId: string }>;
}

async function parseUserId(context: RouteContext) {
    return userContentAssignmentParamsDto.parse(await context.params).userId;
}

export async function GET(_: NextRequest, context: RouteContext) {
    try {
        const userId = await parseUserId(context);
        const candidates = await listAssignableRoleplays(userId);

        return NextResponse.json({ candidates });
    } catch (error) {
        return jsonError(error);
    }
}

export async function POST(request: NextRequest, context: RouteContext) {
    try {
        const userId = await parseUserId(context);
        const input = userContentAssignmentDto.parse(await request.json());
        await assignRoleplayToUser(userId, input);
        const [candidates, quizzes, roleplays] = await Promise.all([
            listAssignableRoleplays(userId),
            listUserAssignedQuizzes(userId),
            listUserAssignedRoleplays(userId),
        ]);

        return NextResponse.json({ candidates, quizzes, roleplays }, { status: 201 });
    } catch (error) {
        return jsonError(error);
    }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
    try {
        const userId = await parseUserId(context);
        const input = userContentAssignmentDto.parse(await request.json());
        await removeRoleplayUserAssignment(userId, input);
        const [candidates, quizzes, roleplays] = await Promise.all([
            listAssignableRoleplays(userId),
            listUserAssignedQuizzes(userId),
            listUserAssignedRoleplays(userId),
        ]);

        return NextResponse.json({ candidates, quizzes, roleplays });
    } catch (error) {
        return jsonError(error);
    }
}
