import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { uiTokens } from "@/lib/ui/tokens";
import { Button } from "./Button";
import { IconButton } from "./IconButton";
import { PrimaryButton } from "./PrimaryButton";

describe("button atoms", () => {
    it.each([
        ["Button", <Button key="button">Action</Button>],
        ["IconButton", <IconButton key="icon-button" aria-label="Action">+</IconButton>],
        ["PrimaryButton", <PrimaryButton key="primary-button">Action principale</PrimaryButton>],
    ])("applies the shared interaction cursor to %s", (_name, component) => {
        const html = renderToStaticMarkup(component);

        expect(html).toContain(uiTokens.interaction.button);
    });

    it("keeps the disabled cursor state in the shared token", () => {
        const html = renderToStaticMarkup(<Button disabled>Action</Button>);

        expect(html).toContain("disabled:cursor-not-allowed");
    });
});
