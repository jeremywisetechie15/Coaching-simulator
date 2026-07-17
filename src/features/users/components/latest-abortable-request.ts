export interface LatestAbortableRequest {
    finish(): void;
    isCurrent(): boolean;
    signal: AbortSignal;
}

export interface LatestAbortableRequestCoordinator {
    cancel(): void;
    start(): LatestAbortableRequest;
}

export function createLatestAbortableRequestCoordinator(): LatestAbortableRequestCoordinator {
    let activeController: AbortController | null = null;
    let generation = 0;

    const cancel = () => {
        generation += 1;
        activeController?.abort();
        activeController = null;
    };

    return {
        cancel,
        start() {
            cancel();

            const controller = new AbortController();
            const requestGeneration = generation;
            activeController = controller;

            const isCurrent = () => (
                generation === requestGeneration
                && activeController === controller
                && !controller.signal.aborted
            );

            return {
                finish() {
                    if (isCurrent()) {
                        activeController = null;
                    }
                },
                isCurrent,
                signal: controller.signal,
            };
        },
    };
}
