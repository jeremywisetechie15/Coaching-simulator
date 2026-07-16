import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DeleteContentConfirmationModal } from "./DeleteContentConfirmationModal";

describe("DeleteContentConfirmationModal", () => {
    it("renders the supplied deletion warning", () => {
        const html = renderToStaticMarkup(
            <DeleteContentConfirmationModal
                busy={false}
                entityLabel="l'organisation"
                name="ACME"
                warning="Cette suppression est définitive."
                onCancel={() => undefined}
                onConfirm={() => undefined}
            />,
        );

        expect(html).toContain("Supprimer l&#x27;organisation");
        expect(html).toContain("Cette suppression est définitive");
    });
});
