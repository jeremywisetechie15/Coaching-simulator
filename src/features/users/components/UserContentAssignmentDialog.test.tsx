import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { UserContentAssignmentDialog } from "./UserContentAssignmentDialog";

describe("UserContentAssignmentDialog", () => {
    it("renders published assignment candidates and explains that source visibility is preserved", () => {
        const html = renderToStaticMarkup(
            <UserContentAssignmentDialog
                candidates={[{
                    description: "Entraînement découverte",
                    id: "11111111-1111-4111-8111-111111111111",
                    title: "Découverte client",
                }]}
                error={null}
                isLoading={false}
                isSubmitting={false}
                kind="roleplay"
                onClose={() => undefined}
                onContentChange={() => undefined}
                onSubmit={() => undefined}
                selectedContentId="11111111-1111-4111-8111-111111111111"
            />,
        );

        expect(html).toContain("Assigner un roleplay");
        expect(html).toContain("Découverte client");
        expect(html).toContain("sans modifier la visibilité");
        expect(html).toContain("Entraînement découverte");
    });
});
