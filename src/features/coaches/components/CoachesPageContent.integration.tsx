import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { CoachListItem } from "@/features/coaches/domain/coach-list";
import { CoachesPageContent } from "./CoachesPageContent";

vi.mock("next/navigation", () => ({
    usePathname: () => "/coaches",
    useRouter: () => ({
        push: vi.fn(),
        refresh: vi.fn(),
        replace: vi.fn(),
    }),
    useSearchParams: () => new URLSearchParams(),
}));

const coach: CoachListItem = {
    avatarSrc: null,
    backgroundImagePath: null,
    backgroundImageUrl: null,
    certifications: "ICF",
    coachingStyle: "Optimiste",
    createdAt: "2026-08-11T18:00:00.000Z",
    diploma: "Master coaching",
    discProfile: "Stable",
    expertiseDomain: "Management, stratégie et transformation",
    id: "coach-1",
    name: "Pierre Laurent",
    status: "published",
    voiceCharacteristic: null,
    voiceId: "cedar",
    voiceName: "Cedar",
};

function renderPage(canManage: boolean) {
    return renderToStaticMarkup(
        <QueryClientProvider client={new QueryClient()}>
            <CoachesPageContent canManage={canManage} initialCoaches={[coach]} />
        </QueryClientProvider>,
    );
}

describe("CoachesPageContent", () => {
    it("shows content-status badges only to administrators", () => {
        expect(renderPage(true)).toContain("Publié");
        expect(renderPage(false)).not.toContain("Publié");
    });
});
