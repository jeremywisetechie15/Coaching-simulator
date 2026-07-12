import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DeleteContentConfirmationModal } from "./DeleteContentConfirmationModal";

describe("DeleteContentConfirmationModal", () => {
    it("explains the published roleplay deletion rule", () => {
        const html = renderToStaticMarkup(
            <DeleteContentConfirmationModal
                busy={false}
                entityLabel="le persona"
                name="Sophie Martin"
                onCancel={() => undefined}
                onConfirm={() => undefined}
            />,
        );

        expect(html).toContain("Supprimer le persona");
        expect(html).toContain("Sophie Martin");
        expect(html).toContain("roleplay publié");
    });
});
