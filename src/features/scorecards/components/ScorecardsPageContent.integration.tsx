import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { APP_NAVIGATION_LABEL } from "@/features/app-shell/domain";
import { CONTENT_STATUS } from "@/features/content/domain";
import type { ScorecardListItem } from "@/features/scorecards/domain";
import { ScorecardsPageContent } from "./ScorecardsPageContent";

vi.mock("next/navigation", () => ({
    usePathname: () => "/scorecards",
    useRouter: () => ({
        push: vi.fn(),
        refresh: vi.fn(),
        replace: vi.fn(),
    }),
    useSearchParams: () => new URLSearchParams({
        category: "Prospection",
        domain: "Commerce et développement commercial",
        publicationStatus: CONTENT_STATUS.draft,
    }),
}));

function scorecard(name: string, status: ScorecardListItem["status"]): ScorecardListItem {
    return {
        category: "Prospection",
        criteriaCount: 3,
        description: "Évaluer la qualité de la découverte.",
        domain: "Commerce et développement commercial",
        id: `${name.toLowerCase().replaceAll(" ", "-")}-id`,
        level: "Moyen",
        methodName: "DAGO",
        name,
        status,
        stepCount: 2,
        visibility: "public",
    };
}

describe("ScorecardsPageContent", () => {
    it("renders the shared title and applies domain, category and status URL filters", () => {
        const html = renderToStaticMarkup(
            <ScorecardsPageContent
                canManage={false}
                scorecards={[
                    scorecard("Scorecard brouillon", CONTENT_STATUS.draft),
                    scorecard("Scorecard publiée", CONTENT_STATUS.published),
                ]}
            />,
        );

        expect(html).toContain(APP_NAVIGATION_LABEL.scorecards);
        expect(html).toContain("Filtrer par domaine");
        expect(html).toContain("Filtrer par catégorie");
        expect(html).toContain("Filtrer par statut de publication");
        expect(html).toContain("Scorecard brouillon");
        expect(html).not.toContain("Scorecard publiée");
    });
});
