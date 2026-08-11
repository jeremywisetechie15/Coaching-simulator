import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CONTENT_STATUS } from "@/features/content/domain";
import type { PersonaListItem } from "@/features/personas/domain/persona-list";
import { PersonasPageContent } from "./PersonasPageContent";

const mocks = vi.hoisted(() => ({
    searchParams: new URLSearchParams(),
}));

vi.mock("next/navigation", () => ({
    usePathname: () => "/personas",
    useRouter: () => ({
        push: vi.fn(),
        refresh: vi.fn(),
        replace: vi.fn(),
    }),
    useSearchParams: () => mocks.searchParams,
}));

const personas: PersonaListItem[] = [
    {
        activitySectorCode: "TIC",
        ageYears: 42,
        avatarUrl: null,
        company: "TechCorp",
        discProfile: "Stable",
        employeeCountValue: 50,
        id: "sophie",
        name: "Sophie Martin",
        pcsGroupCode: "3",
        role: "Directrice commerciale",
        sexCode: "female",
        status: CONTENT_STATUS.draft,
        voiceCharacteristic: null,
        voiceId: "coral",
        voiceName: "Coral",
    },
    {
        activitySectorCode: "BTP",
        ageYears: 24,
        avatarUrl: null,
        company: "Bâtir SARL",
        discProfile: "Dominant",
        employeeCountValue: 8,
        id: "marc",
        name: "Marc Leroy",
        pcsGroupCode: "5",
        role: "Commercial",
        sexCode: "male",
        status: CONTENT_STATUS.draft,
        voiceCharacteristic: null,
        voiceId: "alloy",
        voiceName: "Alloy",
    },
];

function renderPage() {
    return renderToStaticMarkup(
        <QueryClientProvider client={new QueryClient()}>
            <PersonasPageContent canManage={false} initialPersonas={personas} />
        </QueryClientProvider>,
    );
}

beforeEach(() => {
    mocks.searchParams = new URLSearchParams();
});

describe("PersonasPageContent", () => {
    it("uses the shared library filter components for all requested filters", () => {
        const html = renderPage();

        expect(html).toContain("Rechercher un persona...");
        expect(html).toContain("Tous les sexes");
        expect(html).toContain("Tous les âges");
        expect(html).toContain("Toutes les CSP");
        expect(html).toContain("Tous les secteurs");
        expect(html).toContain("Toutes les tailles");
        expect(html).toContain("Tous les profils DISC");
    });

    it("restores and combines persona filters from the URL", () => {
        mocks.searchParams = new URLSearchParams({
            age: "35_44",
            companySize: "pme",
            csp: "3",
            disc: "Stable",
            sector: "TIC",
            sex: "female",
        });

        const html = renderPage();

        expect(html).toContain("Sophie Martin");
        expect(html).not.toContain("Marc Leroy");
        expect(html).toContain("35 à 44 ans");
        expect(html).toContain("PME · 10 à 249 salariés");
    });
});
