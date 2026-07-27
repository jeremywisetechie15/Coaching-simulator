import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
import {
    ROLEPLAY_COACH_MODE,
    ROLEPLAY_COACH_PROMPT_TITLE,
} from "@/features/roleplays/domain";
import { resolveRoleplayCoachSessionPrompt } from "./coach-ai-context";

function createPromptClient(prompt: string | null) {
    const maybeSingle = vi.fn().mockResolvedValue({
        data: prompt === null ? null : { prompt },
        error: null,
    });
    const statusEq = vi.fn().mockReturnValue({ maybeSingle });
    const titleEq = vi.fn().mockReturnValue({ eq: statusEq });
    const select = vi.fn().mockReturnValue({ eq: titleEq });
    const from = vi.fn().mockReturnValue({ select });

    return {
        client: { from } as unknown as SupabaseClient,
        from,
        statusEq,
        titleEq,
    };
}

describe("global roleplay coach prompt", () => {
    it("uses the centralized prompt title", () => {
        expect(ROLEPLAY_COACH_PROMPT_TITLE.global).toBe("prompt.coach.global");
    });

    it.each([
        ROLEPLAY_COACH_MODE.beforeTraining,
        ROLEPLAY_COACH_MODE.afterTraining,
        ROLEPLAY_COACH_MODE.notation,
        "default" as const,
    ])("prepends the global prompt exactly once for %s sessions", async (mode) => {
        const mock = createPromptClient("Règle globale coach.");

        const result = await resolveRoleplayCoachSessionPrompt(
            mock.client,
            "Mission spécifique.",
            mode,
        );

        expect(result.match(/Règle globale coach\./g)).toHaveLength(1);
        expect(result.match(/Mission spécifique\./g)).toHaveLength(1);
        expect(result.indexOf("Règle globale coach.")).toBeLessThan(
            result.indexOf("Mission spécifique."),
        );
        expect(mock.from).toHaveBeenCalledWith("prompts");
        expect(mock.titleEq).toHaveBeenCalledWith(
            "title",
            ROLEPLAY_COACH_PROMPT_TITLE.global,
        );
        expect(mock.statusEq).toHaveBeenCalledWith("status", "published");
    });

    it("keeps feedback independent and does not query the global prompt", async () => {
        const mock = createPromptClient("Cette règle ne doit pas être chargée.");

        const result = await resolveRoleplayCoachSessionPrompt(
            mock.client,
            "Prompt feedback spécifique.",
            ROLEPLAY_COACH_MODE.feedback,
        );

        expect(result).toBe("Prompt feedback spécifique.");
        expect(mock.from).not.toHaveBeenCalled();
    });

    it("fails explicitly when the published global prompt is missing", async () => {
        const mock = createPromptClient(null);

        await expect(
            resolveRoleplayCoachSessionPrompt(
                mock.client,
                "Mission spécifique.",
                ROLEPLAY_COACH_MODE.beforeTraining,
            ),
        ).rejects.toMatchObject({
            code: "ROLEPLAY_COACH_GLOBAL_PROMPT_MISSING",
            status: 500,
        });
    });
});
