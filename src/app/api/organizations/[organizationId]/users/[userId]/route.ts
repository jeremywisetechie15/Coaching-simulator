import { NextRequest, NextResponse } from "next/server";
import { removeOrganizationUser } from "@/features/organizations/server";
import { jsonError } from "@/lib/server/http";

export const dynamic = "force-dynamic";

interface RouteContext {
    params: Promise<{
        organizationId: string;
        userId: string;
    }>;
}

export async function DELETE(_: NextRequest, { params }: RouteContext) {
    try {
        const { organizationId, userId } = await params;
        const membership = await removeOrganizationUser(organizationId, userId);

        return NextResponse.json({ membership, success: true });
    } catch (error) {
        return jsonError(error);
    }
}
