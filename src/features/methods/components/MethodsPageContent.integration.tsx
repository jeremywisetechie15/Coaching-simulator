import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { CONTENT_STATUS } from "@/features/content/domain";
import { METHOD_SCOPE } from "@/features/methods/domain/method";
import { MethodsPageContent } from "./MethodsPageContent";

vi.mock("next/navigation", () => ({
    usePathname: () => "/methods",
    useRouter: () => ({
        push: vi.fn(),
        refresh: vi.fn(),
        replace: vi.fn(),
    }),
    useSearchParams: () => new URLSearchParams(),
}));

describe("MethodsPageContent", () => {
    it("displays the domain and category as distinct method metadata", () => {
        const html = renderToStaticMarkup(
            <MethodsPageContent
                canManage={false}
                methods={[{
                    category: "Gestion des conflits",
                    code: "acor",
                    description: "Apaiser un désaccord.",
                    domain: "Communication",
                    id: "11111111-1111-4111-8111-111111111111",
                    name: "Méthode ACOR",
                    organizationId: null,
                    organizationName: null,
                    readingTimeLabel: "10 min",
                    readingTimeMinutes: 10,
                    scope: METHOD_SCOPE.public,
                    status: CONTENT_STATUS.published,
                    stepCount: 4,
                    subtitle: "Gestion des conflits",
                    tag: "",
                    version: "v1",
                }]}
            />,
        );

        expect(html).toContain("Domaine · Communication");
        expect(html).toContain("Catégorie · Gestion des conflits");
    });
});
