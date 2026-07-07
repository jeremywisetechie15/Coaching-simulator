import { NextRequest, NextResponse } from "next/server";
import { AppError, UnauthorizedError } from "@/lib/server/errors";
import { jsonError } from "@/lib/server/http";
import { createClient } from "@/lib/supabase/server";
import {
    getProfileAvatarExtension,
    getProfileAvatarPublicUrl,
    PROFILE_AVATAR_MAX_SIZE_BYTES,
    PROFILE_AVATAR_BUCKET,
} from "@/features/profile/domain/profile-avatar";
import { fileToStorageUploadBody } from "@/lib/uploads/storage-upload-body";

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
            throw new UnauthorizedError();
        }

        const formData = await request.formData();
        const avatar = formData.get("avatar");

        if (!(avatar instanceof File)) {
            throw new AppError("Avatar manquant.", 400, "INVALID_AVATAR");
        }

        const extension = getProfileAvatarExtension(avatar.type);

        if (!extension) {
            throw new AppError("Format d'avatar non supporté.", 400, "INVALID_AVATAR_TYPE");
        }

        if (avatar.size > PROFILE_AVATAR_MAX_SIZE_BYTES) {
            throw new AppError("L'avatar ne doit pas dépasser 2 Mo.", 400, "AVATAR_TOO_LARGE");
        }

        const avatarPath = `${user.id}/avatar-${Date.now()}.${extension}`;
        const fileBody = await fileToStorageUploadBody(avatar);

        const { error } = await supabase.storage
            .from(PROFILE_AVATAR_BUCKET)
            .upload(avatarPath, fileBody, {
                cacheControl: "3600",
                contentType: avatar.type,
                upsert: false,
            });

        if (error) {
            throw error;
        }

        return NextResponse.json({
            avatar: {
                path: avatarPath,
                url: getProfileAvatarPublicUrl(avatarPath),
            },
        });
    } catch (error) {
        return jsonError(error);
    }
}
