"use client";

import { useCallback, useEffect, useRef } from "react";
import {
    ACTIVE_DURATION_HEARTBEAT_INTERVAL_MS,
    canAccumulateActiveDuration,
    type ActiveDurationHeartbeat,
} from "@/features/activity-tracking/domain";

interface FlushOptions {
    keepalive?: boolean;
}

interface UseActiveDurationTrackerOptions {
    enabled: boolean;
    onFlush: (heartbeat: ActiveDurationHeartbeat, options: FlushOptions) => Promise<void>;
}

const EMPTY_HEARTBEAT: ActiveDurationHeartbeat = {
    activeSeconds: 0,
    aiMessageDelta: 0,
    userMessageDelta: 0,
};

function hasHeartbeatData(heartbeat: ActiveDurationHeartbeat) {
    return heartbeat.activeSeconds > 0
        || heartbeat.aiMessageDelta > 0
        || heartbeat.userMessageDelta > 0;
}

export function useActiveDurationTracker({
    enabled,
    onFlush,
}: UseActiveDurationTrackerOptions) {
    const pendingRef = useRef<ActiveDurationHeartbeat>({ ...EMPTY_HEARTBEAT });
    const lastActivityAtRef = useRef(0);
    const flushPromiseRef = useRef(Promise.resolve());
    const onFlushRef = useRef(onFlush);

    useEffect(() => {
        onFlushRef.current = onFlush;
    }, [onFlush]);

    const markActivity = useCallback((role?: "user" | "assistant") => {
        lastActivityAtRef.current = Date.now();
        if (role === "user") pendingRef.current.userMessageDelta += 1;
        if (role === "assistant") pendingRef.current.aiMessageDelta += 1;
    }, []);

    const flush = useCallback((options: FlushOptions = {}) => {
        const heartbeat = pendingRef.current;
        if (!hasHeartbeatData(heartbeat)) return flushPromiseRef.current;

        pendingRef.current = { ...EMPTY_HEARTBEAT };
        flushPromiseRef.current = flushPromiseRef.current
            .then(() => onFlushRef.current(heartbeat, options))
            .catch(() => {
                pendingRef.current.activeSeconds += heartbeat.activeSeconds;
                pendingRef.current.aiMessageDelta += heartbeat.aiMessageDelta;
                pendingRef.current.userMessageDelta += heartbeat.userMessageDelta;
            });

        return flushPromiseRef.current;
    }, []);

    useEffect(() => {
        if (!enabled) return;

        lastActivityAtRef.current = Date.now();
        const markBrowserActivity = () => markActivity();
        const activityEvents: Array<keyof WindowEventMap> = ["keydown", "pointerdown", "scroll", "touchstart"];
        activityEvents.forEach((eventName) => window.addEventListener(eventName, markBrowserActivity, { passive: true }));

        const tickInterval = window.setInterval(() => {
            if (canAccumulateActiveDuration({
                isVisible: document.visibilityState === "visible",
                lastActivityAtMs: lastActivityAtRef.current,
                nowMs: Date.now(),
            })) {
                pendingRef.current.activeSeconds += 1;
            }
        }, 1_000);
        const heartbeatInterval = window.setInterval(() => {
            void flush();
        }, ACTIVE_DURATION_HEARTBEAT_INTERVAL_MS);
        const flushBeforeLeaving = () => {
            void flush({ keepalive: true });
        };
        const flushWhenHidden = () => {
            if (document.visibilityState === "hidden") flushBeforeLeaving();
        };

        window.addEventListener("pagehide", flushBeforeLeaving);
        document.addEventListener("visibilitychange", flushWhenHidden);

        return () => {
            window.clearInterval(tickInterval);
            window.clearInterval(heartbeatInterval);
            activityEvents.forEach((eventName) => window.removeEventListener(eventName, markBrowserActivity));
            window.removeEventListener("pagehide", flushBeforeLeaving);
            document.removeEventListener("visibilitychange", flushWhenHidden);
            flushBeforeLeaving();
        };
    }, [enabled, flush, markActivity]);

    return { flush, markActivity };
}
