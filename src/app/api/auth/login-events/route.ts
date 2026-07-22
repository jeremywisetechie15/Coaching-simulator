import { NextRequest, NextResponse } from "next/server";
import { recordLoginEvent } from "@/features/activity-tracking/server";
import { jsonError } from "@/lib/server/http";

export const dynamic = "force-dynamic";

function getLoginEventSource(request: NextRequest) {
    return /Android|iPhone|iPad|Mobile/i.test(request.headers.get("user-agent") ?? "")
        ? "mobile_web" as const
        : "web" as const;
}

export async function POST(request: NextRequest) {
    try {
        const result = await recordLoginEvent(getLoginEventSource(request));
        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        return jsonError(error);
    }
}
