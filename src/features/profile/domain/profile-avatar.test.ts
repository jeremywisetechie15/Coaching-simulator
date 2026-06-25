import { describe, expect, it } from "vitest";
import {
    getProfileAvatarExtension,
    PROFILE_AVATAR_ACCEPT,
    PROFILE_AVATAR_BUCKET,
    PROFILE_AVATAR_MAX_SIZE_BYTES,
} from "./profile-avatar";

describe("profile avatar domain", () => {
    it("centralizes accepted avatar mime types", () => {
        expect(PROFILE_AVATAR_BUCKET).toBe("avatars");
        expect(PROFILE_AVATAR_ACCEPT).toBe("image/jpeg,image/png,image/webp");
        expect(PROFILE_AVATAR_MAX_SIZE_BYTES).toBe(2 * 1024 * 1024);
        expect(getProfileAvatarExtension("image/jpeg")).toBe("jpg");
        expect(getProfileAvatarExtension("image/png")).toBe("png");
        expect(getProfileAvatarExtension("image/webp")).toBe("webp");
        expect(getProfileAvatarExtension("image/gif")).toBeNull();
    });
});
