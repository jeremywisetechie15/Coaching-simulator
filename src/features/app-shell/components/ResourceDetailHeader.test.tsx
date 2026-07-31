import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { uiTokens } from "@/lib/ui/tokens";
import { ResourceDetailHeader } from "./ResourceDetailHeader";

vi.mock("next/navigation", () => ({
    usePathname: () => "/methods/method-1",
    useSearchParams: () => new URLSearchParams(),
}));

describe("ResourceDetailHeader", () => {
    it("shares the contextual return and compact management actions", () => {
        const html = renderToStaticMarkup(
            <ResourceDetailHeader
                archiveAction={{
                    errorMessage: "Impossible d'archiver la méthode.",
                    onArchive: vi.fn(),
                }}
                canManage
                editHref="/methods/method-1/edit"
                fallbackHref="/methods"
            />,
        );

        expect(html).toContain("Retour aux méthodes");
        expect(html).toContain("Modifier");
        expect(html).toContain("Archiver");
        expect(html).toContain(uiTokens.resourceDetailHeader.backLink);
        expect(html).toContain(uiTokens.resourceDetailHeader.editButton);
        expect(html).toContain(uiTokens.resourceDetailHeader.archiveButton);
        expect(uiTokens.resourceDetailHeader.editButton).toContain("h-9");
        expect(uiTokens.resourceDetailHeader.editButton).toContain("text-[13px]");
        expect(uiTokens.resourceDetailHeader.editButton).toContain("font-semibold");
        expect(uiTokens.resourceDetailHeader.archiveButton).toContain("h-9");
        expect(uiTokens.resourceDetailHeader.archiveButton).toContain("text-[13px]");
        expect(uiTokens.resourceDetailHeader.archiveButton).toContain("font-semibold");
    });

    it("keeps management actions hidden from learners", () => {
        const html = renderToStaticMarkup(
            <ResourceDetailHeader
                archiveAction={{
                    errorMessage: "Impossible d'archiver la méthode.",
                    onArchive: vi.fn(),
                }}
                editHref="/methods/method-1/edit"
                fallbackHref="/methods"
            />,
        );

        expect(html).toContain("Retour aux méthodes");
        expect(html).not.toContain("Modifier");
        expect(html).not.toContain("Archiver");
    });
});
