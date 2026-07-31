import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
    USER_AI_INTERACTION_TYPE,
    type UserAiInteractions,
} from "@/features/users/domain";
import { uiTokens } from "@/lib/ui/tokens";
import {
    AiInteractionsTab,
    formatUserAiInteractionDuration,
} from "./UserDetailPage";

const interactions: UserAiInteractions = {
    items: [
        {
            durationSeconds: 23_400,
            label: "Simulations IA",
            lastUsedAt: "2026-07-31T10:00:00.000Z",
            sessions: 18,
            type: USER_AI_INTERACTION_TYPE.simulation,
        },
        {
            durationSeconds: 4_500,
            label: "Ask IA Persona",
            lastUsedAt: "2026-07-30T10:00:00.000Z",
            sessions: 9,
            type: USER_AI_INTERACTION_TYPE.askPersona,
        },
        {
            durationSeconds: 3_600,
            label: "Coach IA",
            lastUsedAt: "2026-07-29T10:00:00.000Z",
            sessions: 6,
            type: USER_AI_INTERACTION_TYPE.coach,
        },
    ],
    totalDurationSeconds: 31_500,
};

describe("UserDetailPage AI interactions tab", () => {
    it("renders the four reference metrics and the usage table", () => {
        const html = renderToStaticMarkup(
            <AiInteractionsTab interactions={interactions} />,
        );

        expect(html).toContain("6h 30min");
        expect(html).toContain("1h 15min");
        expect(html).toContain("1h 00min");
        expect(html).toContain("8h 45min");
        expect(html).toContain("Simulations IA");
        expect(html).toContain("Ask IA Persona");
        expect(html).toContain("Coach IA");
        expect(html).toContain("Total IA");
        expect(html).toContain("31/07/2026");
        expect(html).toContain(uiTokens.dataTable.frame);
        expect(html).toContain(uiTokens.dataTable.headerCell);
    });

    it("keeps the reference duration format", () => {
        expect(formatUserAiInteractionDuration(0)).toBe("0min");
        expect(formatUserAiInteractionDuration(3_600)).toBe("1h 00min");
        expect(formatUserAiInteractionDuration(3_900)).toBe("1h 05min");
    });
});
