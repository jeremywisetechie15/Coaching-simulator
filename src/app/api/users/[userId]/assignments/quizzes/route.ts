import { NextRequest, NextResponse } from "next/server";
import {
    userContentAssignmentDto,
    userContentAssignmentParamsDto,
} from "@/features/users/dto";
import {
    assignQuizToUser,
    listAssignableQuizzes,
    listUserAssignedQuizzes,
    removeQuizUserAssignment,
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
        const candidates = await listAssignableQuizzes(userId);

        return NextResponse.json({ candidates });
    } catch (error) {
        return jsonError(error);
    }
}

export async function POST(request: NextRequest, context: RouteContext) {
    try {
        const userId = await parseUserId(context);
        const input = userContentAssignmentDto.parse(await request.json());
        await assignQuizToUser(userId, input);
        const [candidates, quizzes] = await Promise.all([
            listAssignableQuizzes(userId),
            listUserAssignedQuizzes(userId),
        ]);

        return NextResponse.json({ candidates, quizzes }, { status: 201 });
    } catch (error) {
        return jsonError(error);
    }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
    try {
        const userId = await parseUserId(context);
        const input = userContentAssignmentDto.parse(await request.json());
        await removeQuizUserAssignment(userId, input);
        const [candidates, quizzes] = await Promise.all([
            listAssignableQuizzes(userId),
            listUserAssignedQuizzes(userId),
        ]);

        return NextResponse.json({ candidates, quizzes });
    } catch (error) {
        return jsonError(error);
    }
}
