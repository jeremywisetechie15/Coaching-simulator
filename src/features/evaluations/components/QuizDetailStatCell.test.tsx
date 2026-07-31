import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { uiTokens } from "@/lib/ui/tokens";
import { QuizDetailStatCell } from "./QuizDetailStatCell";

describe("QuizDetailStatCell", () => {
    it.each(["danger", "warning", "success"] as const)(
        "uses the shared %s score status color",
        (tone) => {
            const html = renderToStaticMarkup(
                <QuizDetailStatCell
                    helper="Dernière tentative"
                    label="Score actuel"
                    tone={tone}
                    value="75%"
                />,
            );

            expect(html).toContain(uiTokens.tone[tone].text);
        },
    );

    it("keeps an unavailable score neutral", () => {
        const html = renderToStaticMarkup(
            <QuizDetailStatCell
                helper="Aucune tentative"
                label="Meilleur score"
                muted
                value="—"
            />,
        );

        expect(html).toContain(uiTokens.quizDetail.statValueMuted);
    });
});
