import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ScorecardCriterionEditor } from "./ScorecardCriterionEditor";

describe("ScorecardCriterionEditor", () => {
    it("locks structural controls while keeping text and numeric fields editable", () => {
        const html = renderToStaticMarkup(
            <ScorecardCriterionEditor
                competenceOptions={[{ label: "Argumentation", value: "skill-1" }]}
                criterion={{
                    aiInstruction: "Analyser",
                    competenceId: "skill-1",
                    dimension: "savoir_faire",
                    dimensionItemId: "item-1",
                    expectedEvidence: "Une preuve",
                    id: "criterion-1",
                    key: "Un critère",
                    maxPoints: "4",
                    order: "1",
                    verbatim: "Un verbatim",
                }}
                dimensionItemOptions={[{ label: "Convaincre", value: "item-1" }]}
                dimensionOptions={[{ label: "Savoir-faire", value: "savoir_faire" }]}
                index={0}
                onPatch={() => undefined}
                onRemove={() => undefined}
                structureLocked
            />,
        );

        expect(html.match(/<button[^>]*disabled=""/g)).toHaveLength(4);
        expect(html.match(/<(?:input|textarea)[^>]*disabled=""/g)).toBeNull();
        expect(html).toContain("Critère 1");
    });
});
