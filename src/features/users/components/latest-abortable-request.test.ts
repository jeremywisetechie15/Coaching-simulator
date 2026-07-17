import { describe, expect, it } from "vitest";
import { createLatestAbortableRequestCoordinator } from "./latest-abortable-request";

describe("latest abortable request coordinator", () => {
    it("aborts and invalidates an older request when a newer one starts", () => {
        const coordinator = createLatestAbortableRequestCoordinator();
        const firstRequest = coordinator.start();
        const secondRequest = coordinator.start();

        expect(firstRequest.signal.aborted).toBe(true);
        expect(firstRequest.isCurrent()).toBe(false);
        expect(secondRequest.signal.aborted).toBe(false);
        expect(secondRequest.isCurrent()).toBe(true);
    });

    it("aborts and invalidates the current request when the dialog closes", () => {
        const coordinator = createLatestAbortableRequestCoordinator();
        const request = coordinator.start();

        coordinator.cancel();

        expect(request.signal.aborted).toBe(true);
        expect(request.isCurrent()).toBe(false);
    });
});
