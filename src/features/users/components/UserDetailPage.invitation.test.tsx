import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
    PLATFORM_ROLE,
    USER_ROLE,
    USER_STATUS,
    type UserListItem,
} from "@/features/users/domain";
import {
    ORGANIZATION_INVITATION_RESEND_LABEL,
    type OrganizationInvitationResendTarget,
} from "@/features/organizations/domain/organization-invitation";
import { UserDetailPage } from "./UserDetailPage";

vi.mock("next/navigation", () => ({
    usePathname: () => "/users/user-1",
    useRouter: () => ({
        push: vi.fn(),
        refresh: vi.fn(),
        replace: vi.fn(),
    }),
    useSearchParams: () => new URLSearchParams(),
}));

const user: UserListItem = {
    activity: [],
    city: "",
    email: "paul@example.com",
    group: "",
    id: "user-1",
    initials: "PM",
    isSuspended: false,
    joinedAt: "25 juillet 2026",
    lastActiveAt: "Jamais",
    name: "Paul Martin",
    organization: "Alpha",
    phone: "",
    platformRole: PLATFORM_ROLE.user,
    progress: 0,
    role: USER_ROLE.learner,
    roleplays: [],
    skills: [],
    status: USER_STATUS.pending,
    trainings: [],
};

const invitationResendTargets: OrganizationInvitationResendTarget[] = [
    { organizationId: "organization-1", organizationName: "Alpha" },
];

const aiInteractions = {
    items: [],
    totalDurationSeconds: 0,
};

function renderPage(
    initialMode: "edit" | "view",
    targets = invitationResendTargets,
) {
    const queryClient = new QueryClient();

    return renderToStaticMarkup(
        <QueryClientProvider client={queryClient}>
            <UserDetailPage
                aiInteractions={aiInteractions}
                avatarUrl={null}
                initialMode={initialMode}
                initials="AD"
                invitationResendTargets={targets}
                platformRole={PLATFORM_ROLE.admin}
                user={user}
            />
        </QueryClientProvider>,
    );
}

describe("UserDetailPage invitation resend action", () => {
    it("uses the Interaction IA tab instead of the former Statistics tab", () => {
        const html = renderPage("view");

        expect(html).toContain("Interaction IA");
        expect(html).not.toContain("Statistiques");
    });

    it("renders the resend action next to Edit in view mode", () => {
        const html = renderPage("view");

        expect(html).toContain(ORGANIZATION_INVITATION_RESEND_LABEL);
        expect(html).toContain("Modifier");
        expect(html.indexOf(ORGANIZATION_INVITATION_RESEND_LABEL)).toBeLessThan(
            html.indexOf("Modifier"),
        );
    });

    it("renders the same action next to Cancel in edit mode", () => {
        const html = renderPage("edit");

        expect(html).toContain(ORGANIZATION_INVITATION_RESEND_LABEL);
        expect(html).toContain("Annuler");
        expect(html.indexOf(ORGANIZATION_INVITATION_RESEND_LABEL)).toBeLessThan(
            html.indexOf("Annuler"),
        );
    });

    it("hides the action when no invited organization membership exists", () => {
        const html = renderPage("view", []);

        expect(html).not.toContain(ORGANIZATION_INVITATION_RESEND_LABEL);
    });
});
