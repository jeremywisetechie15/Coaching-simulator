import { describe, expect, it } from "vitest";
import { copySessionBackground, SESSION_BACKGROUND_OWNER } from "./session-background";

describe("copySessionBackground", () => {
    it("copies a background into the duplicated owner folder", async () => {
        let copyArguments: [string, string] | null = null;
        const supabase = {
            storage: {
                from() {
                    return {
                        copy: async (source: string, target: string) => {
                            copyArguments = [source, target];
                            return { error: null };
                        },
                    };
                },
            },
        };

        const target = await copySessionBackground(
            supabase as never,
            SESSION_BACKGROUND_OWNER.coach,
            "coach-copy",
            "coaches/coach-1/background.webp",
        );

        expect(copyArguments?.[0]).toBe("coaches/coach-1/background.webp");
        expect(copyArguments?.[1]).toBe(target);
        expect(target).toMatch(/^coaches\/coach-copy\/.+-background\.webp$/);
    });

    it("does nothing without a source background", async () => {
        await expect(copySessionBackground({} as never, SESSION_BACKGROUND_OWNER.coach, "coach-copy", null))
            .resolves.toBeNull();
    });
});
