import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
    OrganizationEvaluationRow,
    OrganizationGroupDetail,
    OrganizationRoleplayRow,
    OrganizationUserRow,
} from "@/features/organizations/domain/organization-detail";
import { uiTokens } from "@/lib/ui/tokens";
import { OrganizationGroupDetailContent } from "./OrganizationGroupDetailContent";

const mocks = vi.hoisted(() => ({
    searchParams: new URLSearchParams(),
}));

vi.mock("next/navigation", () => ({
    usePathname: () => "/organizations/organization-1/groups/group-1",
    useRouter: () => ({
        push: vi.fn(),
        refresh: vi.fn(),
        replace: vi.fn(),
    }),
    useSearchParams: () => mocks.searchParams,
}));

const group: OrganizationGroupDetail = {
    createdAt: "18 juillet 2026",
    description: "Équipe commerciale France",
    id: "group-1",
    memberCount: 2,
    memberNames: ["Adrien Dupont", "Zoé Martin"],
    name: "Sales",
    organizationId: "organization-1",
    organizationName: "Deepmark",
    quizCount: 1,
    roleplayCount: 1,
    status: "active",
};

const members: OrganizationUserRow[] = [
    {
        email: "zoe@example.com",
        id: "user-1",
        initials: "ZM",
        name: "Zoé Martin",
        quizCount: 1,
        role: "Membre",
        roleplayCount: 2,
        status: "active",
    },
];

const roleplays: OrganizationRoleplayRow[] = [
    {
        assignedAt: "20 juillet 2026",
        groupName: "Sales",
        id: "roleplay-1",
        learnerCount: 2,
        learnerNames: ["Adrien Dupont", "Zoé Martin"],
        persona: "Thomas Lion",
        status: "not_started",
        title: "Qualifier un besoin",
    },
];

const evaluations: OrganizationEvaluationRow[] = [
    {
        assignedAt: "21 juillet 2026",
        groupName: "Sales",
        id: "evaluation-1",
        learnerCount: 2,
        learnerNames: ["Adrien Dupont", "Zoé Martin"],
        status: "not_started",
        title: "Quiz commercial",
        type: "Quiz de Connaissance",
    },
];

function renderGroupDetail() {
    return renderToStaticMarkup(
        <QueryClientProvider client={new QueryClient()}>
            <OrganizationGroupDetailContent
                evaluations={evaluations}
                group={group}
                members={members}
                roleplays={roleplays}
            />
        </QueryClientProvider>,
    );
}

describe("organization group detail presentation", () => {
    beforeEach(() => {
        mocks.searchParams = new URLSearchParams();
    });

    it("keeps every overview value and action with the shared detail design", () => {
        const html = renderGroupDetail();

        expect(html).toContain("Détail du groupe");
        expect(html).toContain("Modifier");
        expect(html).toContain("Archiver");
        expect(html).toContain("Informations de base");
        expect(html).toContain("Membres");
        expect(html).toContain("Roleplays");
        expect(html).toContain("Évaluations");
        expect(html).toContain("Sales");
        expect(html).toContain("Deepmark");
        expect(html).toContain("18 juillet 2026");
        expect(html).toContain("2 membres");
        expect(html).toContain("Adrien Dupont");
        expect(html).toContain("1 roleplay");
        expect(html).toContain("Équipe commerciale France");
        expect(html).toContain(uiTokens.organizationDetail.header.title);
        expect(html).toContain(uiTokens.organizationDetail.surface);
        expect(html).toContain(uiTokens.organizationDetail.tabs.item);
    });

    it("keeps the complete member table and its action", () => {
        mocks.searchParams = new URLSearchParams("tab=members");

        const html = renderGroupDetail();

        for (const column of [
            "Utilisateur",
            "Email",
            "Rôle",
            "Statut",
            "Roleplays",
            "Quiz",
            "Actions",
        ]) {
            expect(html).toContain(column);
        }
        expect(html).toContain("Zoé Martin");
        expect(html).toContain("zoe@example.com");
        expect(html).toContain("Membre");
        expect(html).toContain("Actif");
        expect(html).toContain("Voir Zoé Martin");
        expect(html).toContain(uiTokens.dataTable.frame);
    });

    it("keeps the roleplay and evaluation tables", () => {
        mocks.searchParams = new URLSearchParams("tab=roleplays");
        const roleplaysHtml = renderGroupDetail();
        expect(roleplaysHtml).toContain("Qualifier un besoin");
        expect(roleplaysHtml).toContain("2 apprenants");
        expect(roleplaysHtml).toContain("Adrien Dupont");
        expect(roleplaysHtml).toContain("Zoé Martin");
        expect(roleplaysHtml).toContain('tabindex="0"');

        mocks.searchParams = new URLSearchParams("tab=evaluations");
        const evaluationsHtml = renderGroupDetail();
        expect(evaluationsHtml).toContain("Quiz commercial");
        expect(evaluationsHtml).toContain("2 apprenants");
        expect(evaluationsHtml).toContain("Adrien Dupont");
        expect(evaluationsHtml).toContain("Zoé Martin");
        expect(evaluationsHtml).toContain('tabindex="0"');
    });
});
