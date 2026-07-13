import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { coachAvatarOptions } from "@/features/coaches/data/coachOptions";
import { CoachAvatarField } from "./CoachAvatarField";

describe("CoachAvatarField", () => {
    it("uses the shared source selector with the current library avatar selected", () => {
        const selectedAvatar = coachAvatarOptions[0];
        const html = renderToStaticMarkup(
            <CoachAvatarField
                avatarFile={null}
                avatarUrl={selectedAvatar.src}
                coachName="Pierre Laurent"
                onAvatarFileChange={() => undefined}
                onAvatarUrlChange={() => undefined}
            />,
        );

        expect(html).toContain("Avatars proposés");
        expect(html).toContain(`aria-label="${selectedAvatar.name}"`);
        expect(html).toContain('aria-pressed="true"');
    });
});
