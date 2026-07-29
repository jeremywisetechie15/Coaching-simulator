import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SimulationView } from "./SimulationView";

describe("SimulationView", () => {
    it("keeps the live iframe mounted while the transcript panel is available", () => {
        const html = renderToStaticMarkup(
            <SimulationView
                assistantName="Coach LIA"
                iframeSrc="/iframe?transcript_session_id=conversation-1"
                liveTabLabel="AI Coach"
                onBack={() => undefined}
                title="Débrief"
                transcript={[
                    {
                        id: "message-1",
                        speaker: "persona",
                        text: "Voici le retour de cette conversation.",
                        time: "10:12:30",
                    },
                ]}
            />,
        );

        expect(html).toContain('src="/iframe?transcript_session_id=conversation-1"');
        expect(html).toContain("Voici le retour de cette conversation.");
        expect(html).toContain("Coach LIA");
    });
});
