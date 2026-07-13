import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "@/lib/server/http";
import { createOrganizationDto } from "@/features/organizations/dto/create-organization.dto";
import { removeOrganization, updateOrganization } from "@/features/organizations/server";

interface RouteContext {
    params: Promise<{
        organizationId: string;
    }>;
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
    try {
        const { organizationId } = await params;
        const body = await request.json();
        const input = createOrganizationDto.parse(body);
        const organization = await updateOrganization(organizationId, input);

        return NextResponse.json({ organization });
    } catch (error) {
        return jsonError(error);
    }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
    try {
        const { organizationId } = await params;
        const result = await removeOrganization(organizationId);

        return NextResponse.json({
            action: result.action,
            organizationId: result.organizationId,
            success: true,
        });
    } catch (error) {
        return jsonError(error);
    }
}
