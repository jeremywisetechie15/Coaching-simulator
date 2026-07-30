import { renderToStaticMarkup } from "react-dom/server";
import type { ToasterProps } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { uiTokens } from "@/lib/ui/tokens";

const { toasterSpy } = vi.hoisted(() => ({
    toasterSpy: vi.fn((props: ToasterProps) => {
        void props;
        return null;
    }),
}));

vi.mock("sonner", () => ({
    Toaster: toasterSpy,
}));

import { AppToaster } from "./AppToaster";

describe("AppToaster", () => {
    beforeEach(() => {
        toasterSpy.mockClear();
    });

    it("applique les tons sémantiques depuis les design tokens", () => {
        renderToStaticMarkup(<AppToaster />);

        const props = toasterSpy.mock.calls[0]?.[0];
        expect(props?.toastOptions).toMatchObject({
            classNames: {
                error: uiTokens.toast.tone.error,
                info: uiTokens.toast.tone.info,
                success: uiTokens.toast.tone.success,
                warning: uiTokens.toast.tone.warning,
            },
            unstyled: true,
        });
    });
});
