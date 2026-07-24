import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ProfilePasswordControl } from "./ProfilePasswordControl";

describe("ProfilePasswordControl", () => {
    it("renders a change action without exposing a password input", () => {
        const html = renderToStaticMarkup(
            <ProfilePasswordControl onChangePassword={() => undefined} />,
        );

        expect(html).toContain("Mot de passe");
        expect(html).toContain("Modifier");
        expect(html).not.toContain("<input");
    });
});
