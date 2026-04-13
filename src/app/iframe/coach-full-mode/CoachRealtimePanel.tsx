"use client";

import { useEffect, useMemo, useRef } from "react";

export interface CoachRealtimeMessage {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: string;
}

interface CoachRealtimePanelProps {
    coachName: string;
    isSessionActive: boolean;
    isUserSpeaking: boolean;
    messages: CoachRealtimeMessage[];
    userDraft?: string;
    assistantDraft?: string;
}

const formatTime = (iso: string) => {
    const date = new Date(iso);

    return `${date.getHours().toString().padStart(2, "0")}:${date
        .getMinutes()
        .toString()
        .padStart(2, "0")}:${date.getSeconds().toString().padStart(2, "0")}`;
};

export default function CoachRealtimePanel({
    coachName,
    isSessionActive,
    isUserSpeaking,
    messages,
    userDraft,
    assistantDraft,
}: CoachRealtimePanelProps) {
    const endRef = useRef<HTMLDivElement | null>(null);

    const items = useMemo(() => {
        const drafts: CoachRealtimeMessage[] = [];

        if (userDraft?.trim()) {
            drafts.push({
                id: "draft-user",
                role: "user",
                content: userDraft.trim(),
                timestamp: new Date().toISOString(),
            });
        }

        if (assistantDraft?.trim()) {
            drafts.push({
                id: "draft-assistant",
                role: "assistant",
                content: assistantDraft.trim(),
                timestamp: new Date().toISOString(),
            });
        }

        return [...messages, ...drafts];
    }, [assistantDraft, messages, userDraft]);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [items]);

    return (
        <div className="h-full min-w-[280px] w-[320px] border-l border-[#E5E7EB] bg-[#F8F9FB] flex flex-col">
            <div className="flex items-center gap-2 border-b border-[#E5E7EB] bg-white px-4 py-4">
                <div
                    className="h-2 w-2 rounded-full"
                    style={{
                        backgroundColor: isSessionActive ? "#22C55E" : "#9CA3AF",
                        boxShadow: isSessionActive ? "0 0 0 2px rgba(34,197,94,0.25)" : "none",
                    }}
                />
                <span className="text-sm font-semibold text-[#111827]">Live Transcription</span>
                {items.length > 0 && (
                    <span className="ml-auto rounded-full bg-[#F3F4F6] px-2 py-0.5 text-[11px] text-[#9CA3AF]">
                        {items.length} msg
                    </span>
                )}
                {isSessionActive && (
                    <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                        style={{
                            backgroundColor: isUserSpeaking ? "#FEF3C7" : "#ECFDF5",
                            color: isUserSpeaking ? "#B45309" : "#047857",
                        }}
                    >
                        {isUserSpeaking ? "vous parlez" : "à l'écoute"}
                    </span>
                )}
            </div>

            <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-3">
                {items.length === 0 ? (
                    <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center text-[#9CA3AF]">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                        <span className="text-sm">
                            {isSessionActive ? "En attente des messages..." : "Démarrez une session"}
                        </span>
                    </div>
                ) : (
                    items.map((message) => {
                        const isUser = message.role === "user";
                        const isDraft = message.id.startsWith("draft-");
                        const speakerName = isUser ? "Vous" : coachName;

                        return (
                            <div key={message.id} className="flex flex-col gap-1">
                                <div className="flex items-center gap-1.5">
                                    <div
                                        className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full"
                                        style={{ backgroundColor: isUser ? "#E5E7EB" : "#EEF2FF" }}
                                    >
                                        {isUser ? (
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="#6B7280">
                                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                                <circle cx="12" cy="7" r="4" />
                                            </svg>
                                        ) : (
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="#6366F1">
                                                <circle cx="12" cy="12" r="10" />
                                                <path d="M8 14s1.5 2 4 2 4-2 4-2" stroke="white" strokeWidth="1.5" fill="none" />
                                                <line x1="9" y1="9" x2="9.01" y2="9" stroke="white" strokeWidth="2" />
                                                <line x1="15" y1="9" x2="15.01" y2="9" stroke="white" strokeWidth="2" />
                                            </svg>
                                        )}
                                    </div>
                                    <span
                                        className="text-xs font-semibold"
                                        style={{ color: isUser ? "#374151" : "#4F46E5" }}
                                    >
                                        {speakerName}
                                    </span>
                                    <span className="text-[11px] text-[#9CA3AF]">{formatTime(message.timestamp)}</span>
                                    {isDraft && (
                                        <span className="rounded-full bg-[#EEF2FF] px-2 py-0.5 text-[10px] font-medium text-[#4F46E5]">
                                            en cours
                                        </span>
                                    )}
                                </div>
                                <div
                                    className="ml-[30px] rounded-[0_10px_10px_10px] border px-3 py-2 text-[13px] leading-5 text-[#1F2937] shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
                                    style={{
                                        backgroundColor: isUser ? "#FFFFFF" : "#EEF2FF",
                                        borderColor: isUser ? "#E5E7EB" : "#C7D2FE",
                                        opacity: isDraft ? 0.8 : 1,
                                    }}
                                >
                                    {message.content}
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={endRef} />
            </div>
        </div>
    );
}
