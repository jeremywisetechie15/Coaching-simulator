import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "@/lib/server/http";
import { createOrganizationDto } from "@/features/organizations/dto/create-organization.dto";
import { createOrganization } from "@/features/organizations/server";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const input = createOrganizationDto.parse(body);
        const organization = await createOrganization(input);

        return NextResponse.json({ organization }, { status: 201 });
    } catch (error) {
        return jsonError(error);
    }
}
