import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { EditableTextListField } from "./EditableTextListField";

describe("EditableTextListField", () => {
    it("locks list structure while keeping existing text editable", () => {
        const html = renderToStaticMarkup(
            <EditableTextListField
                items={["Objectif existant", "Deuxième objectif"]}
                label="Objectifs"
                onAdd={() => undefined}
                onChange={() => undefined}
                onRemove={() => undefined}
                placeholder="Objectif"
                structureLocked
            />,
        );

        expect(html.match(/<button[^>]*disabled=""/g)).toHaveLength(3);
        expect(html).not.toMatch(/<input[^>]*disabled=""/);
        expect(html).toContain("Objectif existant");
    });
});
