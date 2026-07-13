import { describe, expect, it } from "vitest";
import { copyCoachAvatar, isOwnedCoachAvatarPath } from "./coach-avatar";

describe("coach avatar ownership", () => {
    it("recognizes only storage paths owned by the coach", () => {
        expect(isOwnedCoachAvatarPath("coach-1/avatar.webp", "coach-1")).toBe(true);
        expect(isOwnedCoachAvatarPath("coaches-avatars/coach-1/avatar.webp", "coach-1")).toBe(true);
        expect(isOwnedCoachAvatarPath("coach-2/avatar.webp", "coach-1")).toBe(false);
        expect(isOwnedCoachAvatarPath("/coaches/avatar.webp", "coach-1")).toBe(false);
        expect(isOwnedCoachAvatarPath("https://example.com/avatar.webp", "coach-1")).toBe(false);
    });
});

describe("copyCoachAvatar", () => {
    it("copies a stored avatar into the duplicated coach folder", async () => {
        let copyArguments: [string, string] | null = null;
        const supabase = {
            storage: {
                from(bucket: string) {
                    expect(bucket).toBe("coaches-avatars");
                    return {
                        copy: async (source: string, target: string) => {
                            copyArguments = [source, target];
                            return { error: null };
                        },
                    };
                },
            },
        };

        const target = await copyCoachAvatar(
            supabase as never,
            "coaches-avatars/coach-1/avatar.webp",
            "coach-copy",
        );

        expect(copyArguments?.[0]).toBe("coach-1/avatar.webp");
        expect(copyArguments?.[1]).toBe(target);
        expect(target).toMatch(/^coach-copy\/.+-avatar\.webp$/);
    });
});
