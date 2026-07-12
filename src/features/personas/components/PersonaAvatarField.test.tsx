import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { personaAvatarOptions } from "@/features/personas/data/persona-creation";
import { PersonaAvatarField } from "./PersonaAvatarField";

describe("PersonaAvatarField", () => {
    it("opens the proposed avatar source when the current value belongs to the library", () => {
        const selectedAvatar = personaAvatarOptions[0];
        const html = renderToStaticMarkup(
            <PersonaAvatarField
                avatarFile={null}
                avatarUrl={selectedAvatar.src}
                onAvatarFileChange={() => undefined}
                onAvatarUrlChange={() => undefined}
                personaName="Sophie Martin"
            />,
        );

        expect(html).toContain("Avatars proposés");
        expect(html).toContain(`aria-label="${selectedAvatar.alt}"`);
        expect(html).toContain('aria-pressed="true"');
    });
});
