import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "@/lib/server/http";
import { listOrganizationUsers } from "@/features/organizations/server";

export const dynamic = "force-dynamic";

interface RouteContext {
    params: Promise<{
        organizationId: string;
    }>;
}

export async function GET(_: NextRequest, { params }: RouteContext) {
    try {
        const { organizationId } = await params;
        const users = await listOrganizationUsers(organizationId);

        return NextResponse.json({ users });
    } catch (error) {
        return jsonError(error);
    }
}
