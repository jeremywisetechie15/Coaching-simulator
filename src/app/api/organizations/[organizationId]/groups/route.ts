import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "@/lib/server/http";
import { createOrganizationGroupDto } from "@/features/organizations/dto/create-organization-group.dto";
import { createOrganizationGroup, listOrganizationGroups } from "@/features/organizations/server";

export const dynamic = "force-dynamic";

interface RouteContext {
    params: Promise<{
        organizationId: string;
    }>;
}

export async function GET(_: NextRequest, { params }: RouteContext) {
    try {
        const { organizationId } = await params;
        const groups = await listOrganizationGroups(organizationId);

        return NextResponse.json({ groups });
    } catch (error) {
        return jsonError(error);
    }
}

export async function POST(request: NextRequest, { params }: RouteContext) {
    try {
        const { organizationId } = await params;
        const body = await request.json();
        const input = createOrganizationGroupDto.parse(body);
        const group = await createOrganizationGroup(organizationId, input);

        return NextResponse.json({ group }, { status: 201 });
    } catch (error) {
        return jsonError(error);
    }
}
