import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ROLEPLAY_AI_INSTRUCTIONS_MAX_LENGTH } from "@/features/roleplays/domain";
import { RoleplayAiInstructionsField } from "./RoleplayAiInstructionsField";

describe("RoleplayAiInstructionsField", () => {
    it("renders the private AI instructions field with its accessible editor trigger", () => {
        const html = renderToStaticMarkup(
            <RoleplayAiInstructionsField
                onChange={() => undefined}
                value="Reste prudent au début de l'échange."
            />,
        );

        expect(html).toContain("Instructions IA du scénario");
        expect(html).toContain("non visible par l&#x27;apprenant");
        expect(html).toContain("Définissez comment le persona IA doit agir");
        expect(html).toContain("aria-haspopup=\"dialog\"");
        expect(html).toContain("Ouvrir l&#x27;éditeur");
        expect(html).toContain(`maxLength="${ROLEPLAY_AI_INSTRUCTIONS_MAX_LENGTH}"`);
        expect(html).toContain("Reste prudent au début de l&#x27;échange.");
    });
});
