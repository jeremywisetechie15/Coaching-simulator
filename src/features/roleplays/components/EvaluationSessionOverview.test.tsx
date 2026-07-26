import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { roleplays } from "@/features/roleplays/data/roleplays";
import { roleplaySessions } from "@/features/roleplays/data/sessions";
import { uiTokens } from "@/lib/ui/tokens";
import { EvaluationSessionOverview } from "./EvaluationSessionOverview";

describe("EvaluationSessionOverview", () => {
    it("renders the session metadata and keeps access to the score details", () => {
        const roleplay = {
            ...roleplays[0],
            title: "Gérer une réclamation client",
        };
        const session = roleplaySessions[0];
        const html = renderToStaticMarkup(
            <EvaluationSessionOverview
                context={roleplay.detail.context}
                onOpenScoreDetails={() => undefined}
                roleplay={roleplay}
                session={session}
            />,
        );

        expect(html).toContain(`Session n°${session.attemptNumber}`);
        expect(html).toContain(`Réalisé le ${session.date} à ${session.time}`);
        expect(html).toContain(`Durée session: ${session.duration}`);
        expect(html).toContain("Situation : Gérer une réclamation client");
        expect(html).toContain(`${session.score}%`);
        expect(html).toContain('aria-label="Détail du score global"');
        expect(html).toContain(uiTokens.roleplayEvaluation.sessionOverview.scoreTone.orange);
    });
});
