import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ORGANIZATION_REMOVAL_ACTION } from "@/features/organizations/domain/organization-deletion";
import type {
    OrganizationDetail,
    OrganizationEvaluationRow,
    OrganizationRoleplayRow,
} from "@/features/organizations/domain/organization-detail";
import { uiTokens } from "@/lib/ui/tokens";
import { OrganizationDetailEvaluations } from "./OrganizationDetailEvaluations";
import { OrganizationDetailGroups } from "./OrganizationDetailGroups";
import { OrganizationDetailHeader } from "./OrganizationDetailHeader";
import { OrganizationDetailOverview } from "./OrganizationDetailOverview";
import { OrganizationDetailRoleplays } from "./OrganizationDetailRoleplays";
import { OrganizationDetailTabs } from "./OrganizationDetailTabs";
import { OrganizationDetailUsers } from "./OrganizationDetailUsers";

vi.mock("next/navigation", () => ({
    usePathname: () => "/organizations/deepmark",
    useSearchParams: () => new URLSearchParams(),
}));

const organization: OrganizationDetail = {
    contactEmail: "contact@deepmark.fr",
    createdAt: "15 juin 2023",
    groupCount: 3,
    id: "deepmark",
    industry: "SaaS / Formation",
    name: "Deepmark",
    phone: "+33 1 23 45 67 89",
    programCount: 2,
    region: "france",
    status: "active",
    userCount: 2,
    userNames: ["Adrien Dupont", "Zoé Martin"],
};

const roleplays: OrganizationRoleplayRow[] = [
    {
        assignedAt: "15 mars 2024",
        groupName: "Sales",
        id: "roleplay-1",
        learnerCount: 3,
        learnerNames: ["Adrien Dupont", "Paul Bernard", "Zoé Martin"],
        persona: "Thomas Lion",
        status: "not_started",
        title: "Qualifier un besoin de formation",
    },
];

const evaluations: OrganizationEvaluationRow[] = [
    {
        assignedAt: "10 mars 2024",
        groupName: "Marketing",
        id: "evaluation-1",
        learnerCount: 2,
        learnerNames: ["Adrien Dupont", "Zoé Martin"],
        status: "not_started",
        title: "Quiz - DEEPMARK",
        type: "Quiz de Connaissance",
    },
];

function renderWithQueryClient(children: React.ReactNode) {
    return renderToStaticMarkup(
        <QueryClientProvider client={new QueryClient()}>
            {children}
        </QueryClientProvider>,
    );
}

describe("organization detail presentation", () => {
    it("keeps the header actions and every tab", () => {
        const header = renderToStaticMarkup(
            <OrganizationDetailHeader
                name={organization.name}
                organizationStatus={organization.status}
                removalAction={ORGANIZATION_REMOVAL_ACTION.delete}
            />,
        );
        const tabs = renderToStaticMarkup(
            <OrganizationDetailTabs
                activeTab="overview"
                onTabChange={() => undefined}
            />,
        );

        expect(header).toContain("Deepmark");
        expect(header).toContain("Modifier");
        expect(header).toContain("Supprimer");
        expect(header).toContain(uiTokens.organizationDetail.header.title);
        expect(tabs).toContain("Informations de base");
        expect(tabs).toContain("Groupes");
        expect(tabs).toContain("Utilisateurs");
        expect(tabs).toContain("Roleplays");
        expect(tabs).toContain("Évaluations");
        expect(tabs).toContain('aria-pressed="true"');
    });

    it("keeps every organization information field", () => {
        const html = renderToStaticMarkup(
            <OrganizationDetailOverview organization={organization} />,
        );

        expect(html).toContain("Informations de base");
        expect(html).toContain("Nom de l&#x27;entreprise");
        expect(html).toContain("SaaS / Formation");
        expect(html).toContain("15 juin 2023");
        expect(html).toContain("3 groupes");
        expect(html).toContain("2 utilisateurs");
        expect(html).toContain("Adrien Dupont");
        expect(html).toContain("Zoé Martin");
        expect(html).toContain("contact@deepmark.fr");
        expect(html).toContain("+33 1 23 45 67 89");
        expect(html).toContain("France");
    });

    it("keeps the group and user table controls and columns", () => {
        const groupsHtml = renderWithQueryClient(
            <OrganizationDetailGroups organizationId={organization.id} />,
        );
        const usersHtml = renderWithQueryClient(
            <OrganizationDetailUsers
                organizationId={organization.id}
                organizationName={organization.name}
            />,
        );

        expect(groupsHtml).toContain("Créer un groupe");
        expect(groupsHtml).toContain("Groupe");
        expect(groupsHtml).toContain("Membres");
        expect(groupsHtml).toContain("Roleplays");
        expect(groupsHtml).toContain("Quiz");
        expect(groupsHtml).toContain("Actions");
        expect(usersHtml).toContain("Ajouter des utilisateurs");
        expect(usersHtml).toContain("Utilisateur");
        expect(usersHtml).toContain("Email");
        expect(usersHtml).toContain("Rôle");
        expect(usersHtml).toContain("Statut");
        expect(usersHtml).toContain("Actions");
    });

    it("keeps the consolidated roleplay and evaluation data", () => {
        const roleplaysHtml = renderToStaticMarkup(
            <OrganizationDetailRoleplays roleplays={roleplays} />,
        );
        const evaluationsHtml = renderToStaticMarkup(
            <OrganizationDetailEvaluations evaluations={evaluations} />,
        );

        expect(roleplaysHtml).toContain("Qualifier un besoin de formation");
        expect(roleplaysHtml).toContain("Thomas Lion");
        expect(roleplaysHtml).toContain("Sales");
        expect(roleplaysHtml).toContain("3 apprenants");
        expect(roleplaysHtml).toContain("Paul Bernard");
        expect(roleplaysHtml).toContain("15 mars 2024");
        expect(evaluationsHtml).toContain("Quiz - DEEPMARK");
        expect(evaluationsHtml).toContain("Quiz de Connaissance");
        expect(evaluationsHtml).toContain("Marketing");
        expect(evaluationsHtml).toContain("2 apprenants");
        expect(evaluationsHtml).toContain("Zoé Martin");
        expect(evaluationsHtml).toContain("10 mars 2024");
        expect(evaluationsHtml).toContain(uiTokens.dataTable.groupHeader.row);
    });
});
