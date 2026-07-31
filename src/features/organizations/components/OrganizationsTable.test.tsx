import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { OrganizationListItem } from "@/features/organizations/domain/organization-list";
import { uiTokens } from "@/lib/ui/tokens";
import { OrganizationsTable } from "./OrganizationsTable";

vi.mock("next/navigation", () => ({
    usePathname: () => "/organizations",
    useSearchParams: () => new URLSearchParams(),
}));

const organizations: OrganizationListItem[] = [
    {
        createdAt: "31/07/2026",
        groupCount: 2,
        id: "deepmark",
        name: "Deepmark",
        quizCount: 4,
        roleplayCount: 3,
        status: "active",
        userCount: 12,
    },
    {
        createdAt: "30/07/2026",
        groupCount: 1,
        id: "tech-corp",
        name: "Tech Corp",
        quizCount: 7,
        roleplayCount: 6,
        status: "suspended",
        userCount: 8,
    },
];

describe("OrganizationsTable", () => {
    it("keeps every organization field and action in the shared table design", () => {
        const html = renderToStaticMarkup(
            <OrganizationsTable
                organizations={organizations}
                totalOrganizationCount={organizations.length}
            />,
        );

        expect(html).toContain(uiTokens.dataTable.frame);
        expect(html).toContain(uiTokens.dataTable.width.extraWide);
        expect(html).toContain("Deepmark");
        expect(html).toContain("Tech Corp");
        expect(html).toContain("31/07/2026");
        expect(html).toContain("Actif");
        expect(html).toContain("Désactivé");
        expect(html).toContain("Affichage 1-2 sur 2 organisations");
        expect(html).toContain('aria-label="Voir Deepmark"');
        expect(html).toContain('aria-label="Modifier Deepmark"');
        expect(html).toContain('aria-current="page"');
    });

    it("retains the empty state when filters return no organization", () => {
        const html = renderToStaticMarkup(
            <OrganizationsTable organizations={[]} totalOrganizationCount={2} />,
        );

        expect(html).toContain("Aucune entreprise trouvée");
        expect(html).toContain("Essayez de modifier vos filtres");
        expect(html).toContain("Affichage 0 sur 2 organisations");
    });
});
