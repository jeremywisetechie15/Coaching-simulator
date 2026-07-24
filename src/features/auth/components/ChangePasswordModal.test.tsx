import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ChangePasswordModal } from "./ChangePasswordModal";

describe("ChangePasswordModal", () => {
    it("renders the secure password-change fields and recovery fallback", () => {
        const html = renderToStaticMarkup(
            <ChangePasswordModal onClose={() => undefined} />,
        );

        expect(html).toContain("Mot de passe actuel");
        expect(html).toContain("Nouveau mot de passe");
        expect(html).toContain("Confirmer le nouveau mot de passe");
        expect(html).toContain("current-password");
        expect(html).toContain("new-password");
        expect(html).toContain("Mot de passe oublié ?");
        expect(html).toContain('href="/auth/forgot-password"');
    });
});
