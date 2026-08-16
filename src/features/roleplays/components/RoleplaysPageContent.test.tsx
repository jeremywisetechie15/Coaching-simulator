import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
    ContentStatusBadge,
    LearnerContentStatusBadge,
} from "@/features/content/components";
import {
    CONTENT_STATUS,
    LEARNER_CONTENT_STATUS,
} from "@/features/content/domain";
import { roleplays } from "@/features/roleplays/data/roleplays";
import { RoleplaysPageContent } from "./RoleplaysPageContent";

vi.mock("next/navigation", () => ({
    useRouter: () => ({ refresh: vi.fn(), replace: vi.fn() }),
    useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@tanstack/react-query", () => ({
    useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));

vi.mock("@/features/app-shell/components", () => ({
    ContextualLink: ({ children, href, ...props }: { children: ReactNode; href: string }) => (
        <a href={href} {...props}>{children}</a>
    ),
    useCurrentAppHref: () => "/roleplays",
}));

describe("RoleplaysPageContent publication visibility", () => {
    it("shows publication controls and status to administrators", () => {
        const html = renderToStaticMarkup(
            <RoleplaysPageContent canManage roleplays={[roleplays[0]!]} />,
        );
        const publicationBadgeHtml = renderToStaticMarkup(
            <ContentStatusBadge
                className="h-[26px] text-[12px]"
                status={CONTENT_STATUS.published}
            />,
        );

        expect(html).toContain('aria-label="Filtrer par statut de publication"');
        expect(html).toContain("Tous les statuts de publication");
        expect(html).toContain(publicationBadgeHtml);
        expect(html).not.toContain('aria-label="Filtrer par progression"');
    });

    it("keeps publication controls hidden from learners", () => {
        const html = renderToStaticMarkup(
            <RoleplaysPageContent canManage={false} roleplays={[roleplays[0]!]} />,
        );
        const learnerBadgeHtml = renderToStaticMarkup(
            <LearnerContentStatusBadge
                className="h-[26px] text-[12px]"
                status={LEARNER_CONTENT_STATUS.validated}
            />,
        );

        expect(html).toContain('aria-label="Filtrer par progression"');
        expect(html).toContain(learnerBadgeHtml);
        expect(html).not.toContain("Tous les statuts de publication");
        expect(html).not.toContain('aria-label="Filtrer par statut de publication"');
    });
});
