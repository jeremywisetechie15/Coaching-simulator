import { NextRequest, NextResponse } from "next/server";
import { directUploadCleanupDto, directUploadIntentInputDto } from "@/lib/uploads/direct-upload";
import { cleanupOwnedDirectUploads, createDirectUploadIntent } from "@/lib/uploads/direct-upload.server";
import { jsonError } from "@/lib/server/http";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
    try {
        const input = directUploadIntentInputDto.parse(await request.json());
        const intent = await createDirectUploadIntent(input);

        return NextResponse.json({ intent }, { status: 201 });
    } catch (error) {
        return jsonError(error);
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { references } = directUploadCleanupDto.parse(await request.json());
        await cleanupOwnedDirectUploads(references);

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        return jsonError(error);
    }
}
