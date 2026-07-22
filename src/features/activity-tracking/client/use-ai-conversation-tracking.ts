"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
    AI_CONVERSATION_STATUS,
    type AiConversationStatus,
    type AiConversationType,
} from "@/features/activity-tracking/domain";
import {
    createTrackedAiConversation,
    updateTrackedAiConversation,
} from "./activity-tracking.client";
import { useActiveDurationTracker } from "./use-active-duration-tracker";

const EMPTY_HEARTBEAT = {
    activeSeconds: 0,
    aiMessageDelta: 0,
    userMessageDelta: 0,
} as const;

export function useAiConversationTracking(interactionType: AiConversationType | null) {
    const [conversationId, setConversationId] = useState<string | null>(null);
    const conversationIdRef = useRef<string | null>(null);
    const isMountedRef = useRef(true);
    const startPromiseRef = useRef<Promise<string | null> | null>(null);
    const { flush, markActivity } = useActiveDurationTracker({
        enabled: Boolean(conversationId),
        onFlush: async (heartbeat, options) => {
            const activeConversationId = conversationIdRef.current;
            if (!activeConversationId) return;
            await updateTrackedAiConversation(
                activeConversationId,
                heartbeat,
                AI_CONVERSATION_STATUS.active,
                options,
            );
        },
    });

    const start = useCallback(async () => {
        if (!interactionType) return null;
        if (conversationIdRef.current) return conversationIdRef.current;
        if (startPromiseRef.current) return startPromiseRef.current;

        const promise = createTrackedAiConversation(interactionType)
            .then((id) => {
                if (!isMountedRef.current) {
                    void updateTrackedAiConversation(
                        id,
                        EMPTY_HEARTBEAT,
                        AI_CONVERSATION_STATUS.abandoned,
                        { keepalive: true },
                    );
                    return null;
                }
                conversationIdRef.current = id;
                setConversationId(id);
                markActivity();
                return id;
            })
            .catch((error) => {
                console.warn("Unable to start AI conversation tracking:", error);
                return null;
            })
            .finally(() => {
                startPromiseRef.current = null;
            });
        startPromiseRef.current = promise;
        return promise;
    }, [interactionType, markActivity]);

    const end = useCallback(async (status: Exclude<AiConversationStatus, "active">) => {
        const activeConversationId = conversationIdRef.current ?? await startPromiseRef.current;
        if (!activeConversationId) return;

        await flush();
        await updateTrackedAiConversation(activeConversationId, EMPTY_HEARTBEAT, status);
        conversationIdRef.current = null;
        setConversationId(null);
    }, [flush]);

    useEffect(() => {
        isMountedRef.current = true;

        return () => {
            isMountedRef.current = false;
            const activeConversationId = conversationIdRef.current;
            if (!activeConversationId) return;
            void updateTrackedAiConversation(
                activeConversationId,
                EMPTY_HEARTBEAT,
                AI_CONVERSATION_STATUS.abandoned,
                { keepalive: true },
            );
        };
    }, []);

    return { end, markActivity, start };
}
