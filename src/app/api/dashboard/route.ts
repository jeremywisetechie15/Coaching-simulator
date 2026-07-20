import { NextRequest, NextResponse } from "next/server";
import { dashboardQueryDto } from "@/features/dashboard/dto";
import { getCurrentUserDashboard } from "@/features/dashboard/server";
import { jsonError } from "@/lib/server/http";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    try {
        const input = dashboardQueryDto.parse({
            period: request.nextUrl.searchParams.get("period") ?? undefined,
        });
        const dashboard = await getCurrentUserDashboard(input.period);

        return NextResponse.json({ dashboard });
    } catch (error) {
        return jsonError(error);
    }
}
