import { NextRequest, NextResponse } from "next/server";
import { adminDashboardQueryDto } from "@/features/admin-dashboard/dto";
import { getAdminDashboard } from "@/features/admin-dashboard/server";
import { jsonError } from "@/lib/server/http";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    try {
        const input = adminDashboardQueryDto.parse({
            organization: request.nextUrl.searchParams.get("organization") ?? undefined,
            period: request.nextUrl.searchParams.get("period") ?? undefined,
        });
        const dashboard = await getAdminDashboard(input);

        return NextResponse.json({ dashboard });
    } catch (error) {
        return jsonError(error);
    }
}
