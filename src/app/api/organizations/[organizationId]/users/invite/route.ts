import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "@/lib/server/http";
import { inviteOrganizationUserDto } from "@/features/organizations/dto/invite-organization-user.dto";
import { inviteOrganizationUser } from "@/features/organizations/server";

interface RouteContext {
    params: Promise<{
        organizationId: string;
    }>;
}

export async function POST(request: NextRequest, { params }: RouteContext) {
    try {
        const { organizationId } = await params;
        const body = await request.json();
        const input = inviteOrganizationUserDto.parse(body);
        const redirectParams = new URLSearchParams({
            organization_id: organizationId,
            redirect: "/profile",
        });
        const redirectTo = `${request.nextUrl.origin}/auth/set-password?${redirectParams.toString()}`;
        const user = await inviteOrganizationUser(organizationId, input, redirectTo);

        return NextResponse.json({ user }, { status: 201 });
    } catch (error) {
        return jsonError(error);
    }
}
