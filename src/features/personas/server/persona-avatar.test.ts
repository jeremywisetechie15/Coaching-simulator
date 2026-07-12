import { describe, expect, it } from "vitest";
import { copyPersonaAvatar, isOwnedPersonaAvatarPath } from "./persona-avatar";

describe("persona avatar ownership", () => {
    it("recognizes only storage paths owned by the persona", () => {
        expect(isOwnedPersonaAvatarPath("persona-1/avatar.webp", "persona-1")).toBe(true);
        expect(isOwnedPersonaAvatarPath("personas-avatars/persona-1/avatar.webp", "persona-1")).toBe(true);
        expect(isOwnedPersonaAvatarPath("persona-2/avatar.webp", "persona-1")).toBe(false);
        expect(isOwnedPersonaAvatarPath("/personas/avatar.webp", "persona-1")).toBe(false);
        expect(isOwnedPersonaAvatarPath("https://example.com/avatar.webp", "persona-1")).toBe(false);
    });
});

describe("copyPersonaAvatar", () => {
    it("copies an owned storage object into the duplicated persona folder", async () => {
        let copyArguments: [string, string] | null = null;
        const supabase = {
            storage: {
                from(bucket: string) {
                    expect(bucket).toBe("personas-avatars");
                    return {
                        copy: async (source: string, target: string) => {
                            copyArguments = [source, target];
                            return { error: null };
                        },
                    };
                },
            },
        };

        const target = await copyPersonaAvatar(
            supabase as never,
            "personas-avatars/persona-1/avatar.webp",
            "persona-copy",
        );

        expect(copyArguments?.[0]).toBe("persona-1/avatar.webp");
        expect(copyArguments?.[1]).toBe(target);
        expect(target).toMatch(/^persona-copy\/.+-avatar\.webp$/);
    });

    it("keeps an external avatar URL without copying storage", async () => {
        const target = await copyPersonaAvatar({} as never, "https://example.com/avatar.webp", "persona-copy");

        expect(target).toBe("https://example.com/avatar.webp");
    });
});
