import { NextRequest, NextResponse } from "next/server";
import { createAiConversation } from "@/features/activity-tracking/server";
import { jsonError } from "@/lib/server/http";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
    try {
        const conversation = await createAiConversation(await request.json());
        return NextResponse.json({ conversation }, { status: 201 });
    } catch (error) {
        return jsonError(error);
    }
}
