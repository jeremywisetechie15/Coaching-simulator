import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "@/lib/server/http";
import { createOrganizationGroupDto } from "@/features/organizations/dto/create-organization-group.dto";
import {
    archiveOrganizationGroup,
    getOrganizationGroupDetail,
    updateOrganizationGroup,
} from "@/features/organizations/server";

export const dynamic = "force-dynamic";

interface RouteContext {
    params: Promise<{
        groupId: string;
        organizationId: string;
    }>;
}

export async function GET(_: NextRequest, { params }: RouteContext) {
    try {
        const { groupId, organizationId } = await params;
        const group = await getOrganizationGroupDetail(organizationId, groupId);

        return NextResponse.json({ group });
    } catch (error) {
        return jsonError(error);
    }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
    try {
        const { groupId, organizationId } = await params;
        const input = createOrganizationGroupDto.parse(await request.json());
        const group = await updateOrganizationGroup(organizationId, groupId, input);

        return NextResponse.json({ group });
    } catch (error) {
        return jsonError(error);
    }
}

export async function DELETE(_: NextRequest, { params }: RouteContext) {
    try {
        const { groupId, organizationId } = await params;
        await archiveOrganizationGroup(organizationId, groupId);

        return NextResponse.json({ ok: true });
    } catch (error) {
        return jsonError(error);
    }
}
