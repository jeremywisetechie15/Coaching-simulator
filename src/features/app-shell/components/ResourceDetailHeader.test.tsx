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
                removalAction={{
                    entityLabel: "la méthode",
                    errorMessage: "Impossible d'archiver la méthode.",
                    name: "Méthode test",
                    onRemove: vi.fn(),
                    status: "published",
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
                removalAction={{
                    entityLabel: "la méthode",
                    errorMessage: "Impossible d'archiver la méthode.",
                    name: "Méthode test",
                    onRemove: vi.fn(),
                    status: "published",
                }}
                editHref="/methods/method-1/edit"
                fallbackHref="/methods"
            />,
        );

        expect(html).toContain("Retour aux méthodes");
        expect(html).not.toContain("Modifier");
        expect(html).not.toContain("Archiver");
    });

    it("offers permanent deletion for an unused draft", () => {
        const html = renderToStaticMarkup(
            <ResourceDetailHeader
                removalAction={{
                    entityLabel: "la méthode",
                    errorMessage: "Impossible de supprimer la méthode.",
                    name: "Méthode test",
                    onRemove: vi.fn(),
                    status: "draft",
                }}
                canManage
                editHref="/methods/method-1/edit"
                fallbackHref="/methods"
            />,
        );

        expect(html).toContain("Supprimer");
        expect(html).not.toContain("Archiver");
    });

    it("keeps archived content read-only on its detail page", () => {
        const html = renderToStaticMarkup(
            <ResourceDetailHeader
                removalAction={{
                    entityLabel: "la méthode",
                    errorMessage: "Impossible de modifier la méthode.",
                    name: "Méthode archivée",
                    onRemove: vi.fn(),
                    status: "archived",
                }}
                canManage
                editHref="/methods/method-1/edit"
                fallbackHref="/methods"
            />,
        );

        expect(html).toContain("Retour aux méthodes");
        expect(html).not.toContain("Modifier");
        expect(html).not.toContain('href="/methods/method-1/edit"');
    });
});
