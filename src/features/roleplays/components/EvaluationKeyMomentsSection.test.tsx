import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { demoEvaluationKeyMoments } from "@/features/roleplays/data/evaluation";
import { EvaluationKeyMomentsSection } from "./EvaluationKeyMomentsSection";

describe("EvaluationKeyMomentsSection", () => {
    it("renders the detected moments as independently collapsed accordions", () => {
        const html = renderToStaticMarkup(
            <EvaluationKeyMomentsSection moments={demoEvaluationKeyMoments} />,
        );

        expect(html).toContain("Moments clés de l&#x27;échange");
        expect(html).toContain("3 moments détectés");
        expect(html).toContain("Moment clé n°1");
        expect(html).toContain("Moment clé n°2");
        expect(html).toContain("Moment clé n°3");
        expect(html.match(/aria-expanded="false"/g)).toHaveLength(3);
        expect(html).not.toContain("Pourquoi c&#x27;est un moment clé");
    });
});
