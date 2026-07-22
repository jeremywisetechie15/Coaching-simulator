"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    AgentEventsEnum,
    LiveAvatarSession,
    SessionDisconnectReason,
    SessionEvent,
    SessionInteractivityMode,
    SessionState,
    VoiceChatEvent,
} from "@heygen/liveavatar-web-sdk";
import { AlertCircle, Camera, Loader2, MicOff, Phone, PhoneOff, VideoOff } from "lucide-react";
import { prepareIframeSession, type IframeSessionConfig } from "../actions";
import CoachRealtimePanel, { type CoachRealtimeMessage } from "./CoachRealtimePanel";
import {
    ROLEPLAY_COACH_TRANSCRIPT_EVENT,
    type RoleplayCoachTranscriptEvent,
} from "@/features/roleplays/domain/coach-session-notes";
import { useAiConversationTracking } from "@/features/activity-tracking/client";
import {
    AI_CONVERSATION_STATUS,
    AI_CONVERSATION_TYPE,
} from "@/features/activity-tracking/domain";

type CoachSessionStatus = "loading" | "ready" | "connecting" | "connected" | "error" | "ended";

interface CoachHeygenClientProps {
    scenarioId?: string;
    mode: string;
    refSessionId?: string;
    model: string;
    coachId?: string;
    coachMode?: "before_training" | "after_training" | "notation";
    coachSessionId?: string;
    step?: number;
}

const createMessage = (
    role: CoachRealtimeMessage["role"],
    content: string,
    eventId?: string,
): CoachRealtimeMessage => ({
    id: eventId || `${role}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    role,
    content: content.trim(),
    timestamp: new Date().toISOString(),
});

export default function CoachHeygenClient({
    scenarioId,
    mode,
    refSessionId,
    model,
    coachId,
    coachMode,
    coachSessionId,
    step,
}: CoachHeygenClientProps) {
    const [status, setStatus] = useState<CoachSessionStatus>("loading");
    const [error, setError] = useState<string | null>(null);
    const [config, setConfig] = useState<IframeSessionConfig | null>(null);
    const [sessionDuration, setSessionDuration] = useState(0);
    const [isAiSpeaking, setIsAiSpeaking] = useState(false);
    const [isUserSpeaking, setIsUserSpeaking] = useState(false);
    const [isMicMuted, setIsMicMuted] = useState(false);
    const [isCameraOff, setIsCameraOff] = useState(false);
    const [hasVideoStream, setHasVideoStream] = useState(false);
    const [liveMessages, setLiveMessages] = useState<CoachRealtimeMessage[]>([]);
    const [userDraft, setUserDraft] = useState("");
    const [assistantDraft, setAssistantDraft] = useState("");

    const avatarVideoRef = useRef<HTMLVideoElement | null>(null);
    const localPreviewRef = useRef<HTMLVideoElement | null>(null);
    const sessionRef = useRef<LiveAvatarSession | null>(null);
    const localVideoStreamRef = useRef<MediaStream | null>(null);
    const keepAliveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const sessionDurationRef = useRef(0);
    const processedEventIdsRef = useRef(new Set<string>());
    const lastMessageRef = useRef<CoachRealtimeMessage | null>(null);
    const initCalledRef = useRef(false);
    const isManuallyStoppingRef = useRef(false);
    const isMountedRef = useRef(true);
    const {
        end: endTrackedConversation,
        markActivity: markTrackedConversationActivity,
        start: startTrackedConversation,
    } = useAiConversationTracking(AI_CONVERSATION_TYPE.coach);

    const coachDisplayName = useMemo(() => {
        if (!config) {
            return "Coach AI";
        }

        const parts = config.personaName.split(" ").filter(Boolean);
        if (parts.length === 0) {
            return "Coach AI";
        }

        return `Coach ${parts.join(" ")}`;
    }, [config]);

    const resetIntervals = useCallback(() => {
        if (keepAliveIntervalRef.current) {
            clearInterval(keepAliveIntervalRef.current);
            keepAliveIntervalRef.current = null;
        }

        if (durationIntervalRef.current) {
            clearInterval(durationIntervalRef.current);
            durationIntervalRef.current = null;
        }
    }, []);

    const stopLocalPreview = useCallback(() => {
        if (localVideoStreamRef.current) {
            localVideoStreamRef.current.getTracks().forEach((track) => track.stop());
            localVideoStreamRef.current = null;
        }

        if (localPreviewRef.current) {
            localPreviewRef.current.srcObject = null;
        }

        setHasVideoStream(false);
        setIsCameraOff(false);
    }, []);

    const teardownSession = useCallback(async () => {
        resetIntervals();

        const activeSession = sessionRef.current;
        sessionRef.current = null;

        if (activeSession) {
            try {
                await activeSession.stop();
            } catch (stopError) {
                console.error("Failed to stop LiveAvatar session:", stopError);
            }
        }

        if (avatarVideoRef.current) {
            avatarVideoRef.current.srcObject = null;
        }

        stopLocalPreview();
        setIsAiSpeaking(false);
        setIsUserSpeaking(false);
        setIsMicMuted(false);
    }, [resetIntervals, stopLocalPreview]);

    useEffect(() => {
        isMountedRef.current = true;

        return () => {
            isMountedRef.current = false;
        };
    }, []);

    useEffect(() => {
        if (initCalledRef.current) {
            return;
        }

        initCalledRef.current = true;

        const init = async () => {
            try {
                const result = await prepareIframeSession({
                    scenarioId,
                    mode: mode as "standard" | "coach",
                    refSessionId,
                    model,
                    coachId,
                    coachMode,
                    step,
                });

                if (!result.success || !result.data) {
                    throw new Error(result.error || "Failed to prepare coach session");
                }

                if (!isMountedRef.current) {
                    return;
                }

                setConfig(result.data);
                setStatus("ready");
            } catch (initError) {
                if (!isMountedRef.current) {
                    return;
                }

                setError(initError instanceof Error ? initError.message : "Initialization error");
                setStatus("error");
            }
        };

        init();
    }, [coachId, coachMode, mode, model, refSessionId, scenarioId, step]);

    useEffect(() => {
        return () => {
            void teardownSession();
        };
    }, [teardownSession]);

    const addMessage = useCallback((role: CoachRealtimeMessage["role"], text: string, eventId?: string) => {
        const trimmed = text.trim();

        if (!trimmed) {
            return;
        }

        if (eventId && processedEventIdsRef.current.has(eventId)) {
            return;
        }

        if (eventId) {
            processedEventIdsRef.current.add(eventId);
        }

        const lastMessage = lastMessageRef.current;
        if (lastMessage && lastMessage.role === role && lastMessage.content === trimmed) return;

        const newMessage = createMessage(role, trimmed, eventId);
        lastMessageRef.current = newMessage;
        markTrackedConversationActivity(role);
        setLiveMessages((previous) => [...previous, newMessage]);

        if (coachSessionId && scenarioId && window.parent !== window) {
            const messageEvent: RoleplayCoachTranscriptEvent = {
                coachSessionId,
                message: newMessage,
                scenarioId,
                type: ROLEPLAY_COACH_TRANSCRIPT_EVENT,
            };
            window.parent.postMessage(messageEvent, window.location.origin);
        }
    }, [coachSessionId, markTrackedConversationActivity, scenarioId]);

    const syncLocalPreview = useCallback(() => {
        if (localPreviewRef.current && localVideoStreamRef.current && !isCameraOff) {
            localPreviewRef.current.srcObject = localVideoStreamRef.current;
        }
    }, [isCameraOff]);

    useEffect(() => {
        syncLocalPreview();
    }, [hasVideoStream, syncLocalPreview]);

    const startLocalPreview = useCallback(async () => {
        try {
            const previewStream = await navigator.mediaDevices.getUserMedia({ video: true });
            localVideoStreamRef.current = previewStream;
            setHasVideoStream(true);

            if (!isCameraOff && localPreviewRef.current) {
                localPreviewRef.current.srcObject = previewStream;
            }
        } catch (previewError) {
            console.warn("Camera preview unavailable:", previewError);
            setHasVideoStream(false);
        }
    }, [isCameraOff]);

    const bindSessionEvents = useCallback((session: LiveAvatarSession) => {
        session.on(SessionEvent.SESSION_STATE_CHANGED, (state) => {
            if (!isMountedRef.current) {
                return;
            }

            if (state === SessionState.CONNECTING) {
                setStatus("connecting");
            }

            if (state === SessionState.CONNECTED) {
                setStatus("connected");
            }
        });

        session.on(SessionEvent.SESSION_STREAM_READY, () => {
            if (avatarVideoRef.current) {
                session.attach(avatarVideoRef.current);
            }
        });

        session.on(SessionEvent.SESSION_DISCONNECTED, (reason) => {
            if (!isMountedRef.current) {
                return;
            }

            resetIntervals();
            stopLocalPreview();
            setIsAiSpeaking(false);
            setIsUserSpeaking(false);
            setIsMicMuted(false);

            if (isManuallyStoppingRef.current || reason === SessionDisconnectReason.CLIENT_INITIATED) {
                setStatus("ended");
                return;
            }

            void endTrackedConversation(AI_CONVERSATION_STATUS.error).catch((trackingError) => {
                console.warn("Unable to close disconnected coach tracking:", trackingError);
            });
            setError("La session avatar a été interrompue.");
            setStatus("error");
        });

        session.on(AgentEventsEnum.AVATAR_SPEAK_STARTED, () => {
            if (isMountedRef.current) {
                markTrackedConversationActivity();
                setIsAiSpeaking(true);
            }
        });

        session.on(AgentEventsEnum.AVATAR_SPEAK_ENDED, () => {
            if (!isMountedRef.current) {
                return;
            }

            setIsAiSpeaking(false);

            try {
                session.startListening();
            } catch (listeningError) {
                console.warn("Failed to re-enter listening state:", listeningError);
            }
        });

        session.on(AgentEventsEnum.USER_SPEAK_STARTED, () => {
            if (isMountedRef.current) {
                markTrackedConversationActivity();
                setIsUserSpeaking(true);
            }
        });

        session.on(AgentEventsEnum.USER_SPEAK_ENDED, () => {
            if (isMountedRef.current) {
                setIsUserSpeaking(false);
            }
        });

        session.on(AgentEventsEnum.USER_TRANSCRIPTION_CHUNK, (event) => {
            if (isMountedRef.current) {
                setUserDraft(event.text || "");
            }
        });

        session.on(AgentEventsEnum.AVATAR_TRANSCRIPTION_CHUNK, (event) => {
            if (isMountedRef.current) {
                setAssistantDraft(event.text || "");
            }
        });

        session.on(AgentEventsEnum.USER_TRANSCRIPTION, (event) => {
            if (!isMountedRef.current) {
                return;
            }

            setUserDraft("");
            addMessage("user", event.text || "", event.event_id);
        });

        session.on(AgentEventsEnum.AVATAR_TRANSCRIPTION, (event) => {
            if (!isMountedRef.current) {
                return;
            }

            setAssistantDraft("");
            addMessage("assistant", event.text || "", event.event_id);
        });

        session.on(AgentEventsEnum.SESSION_STOPPED, () => {
            if (isMountedRef.current) {
                setStatus("ended");
            }
        });

        session.voiceChat.on(VoiceChatEvent.MUTED, () => {
            if (isMountedRef.current) {
                setIsMicMuted(true);
            }
        });

        session.voiceChat.on(VoiceChatEvent.UNMUTED, () => {
            if (isMountedRef.current) {
                setIsMicMuted(false);
            }
        });
    }, [addMessage, endTrackedConversation, markTrackedConversationActivity, resetIntervals, stopLocalPreview]);

    const startSession = useCallback(async () => {
        if (!config) {
            return;
        }

        setStatus("connecting");
        setError(null);
        setLiveMessages([]);
        lastMessageRef.current = null;
        setUserDraft("");
        setAssistantDraft("");
        setSessionDuration(0);
        setIsAiSpeaking(false);
        setIsUserSpeaking(false);
        setIsMicMuted(false);
        sessionDurationRef.current = 0;
        processedEventIdsRef.current.clear();
        isManuallyStoppingRef.current = false;

        try {
            await startLocalPreview();

            const response = await fetch("/api/coach-heygen-session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    systemInstructions: config.systemInstructions,
                    scenarioTitle: config.scenarioTitle,
                    coachMode: config.coachMode,
                    model: config.model,
                }),
            });

            const data = await response.json();

            if (!response.ok || data.error || !data.sessionToken) {
                throw new Error(data.error || "Failed to create HeyGen FULL session");
            }

            const liveAvatarSession = new LiveAvatarSession(data.sessionToken, {
                voiceChat: {
                    mode: SessionInteractivityMode.CONVERSATIONAL,
                },
            });

            bindSessionEvents(liveAvatarSession);
            sessionRef.current = liveAvatarSession;

            await liveAvatarSession.start();
            await startTrackedConversation();

            try {
                liveAvatarSession.startListening();
            } catch (listeningError) {
                console.warn("Failed to enter listening state after start:", listeningError);
            }

            const startedAt = Date.now();
            durationIntervalRef.current = setInterval(() => {
                const duration = Math.floor((Date.now() - startedAt) / 1000);
                sessionDurationRef.current = duration;
                setSessionDuration(duration);
            }, 1000);

            keepAliveIntervalRef.current = setInterval(() => {
                void liveAvatarSession.keepAlive().catch((keepAliveError) => {
                    console.error("LiveAvatar keep-alive failed:", keepAliveError);
                });
            }, 120000);

            if (avatarVideoRef.current) {
                liveAvatarSession.attach(avatarVideoRef.current);
            }
        } catch (startError) {
            await endTrackedConversation(AI_CONVERSATION_STATUS.error).catch(() => undefined);
            await teardownSession();

            if (!isMountedRef.current) {
                return;
            }

            setError(startError instanceof Error ? startError.message : "Failed to start session");
            setStatus("error");
        }
    }, [bindSessionEvents, config, endTrackedConversation, startLocalPreview, startTrackedConversation, teardownSession]);

    const endSession = useCallback(async () => {
        isManuallyStoppingRef.current = true;
        await endTrackedConversation(AI_CONVERSATION_STATUS.completed).catch((trackingError) => {
            console.warn("Unable to complete coach tracking:", trackingError);
        });
        await teardownSession();

        if (!isMountedRef.current) {
            return;
        }

        setStatus("ended");
    }, [endTrackedConversation, teardownSession]);

    const toggleMic = useCallback(async () => {
        const activeSession = sessionRef.current;

        if (!activeSession || status !== "connected") {
            return;
        }

        try {
            if (activeSession.voiceChat.isMuted) {
                await activeSession.voiceChat.unmute();
            } else {
                await activeSession.voiceChat.mute();
            }
        } catch (micError) {
            console.error("Failed to toggle microphone:", micError);
        }
    }, [status]);

    const toggleCamera = useCallback(() => {
        const videoTrack = localVideoStreamRef.current?.getVideoTracks()[0];

        if (!videoTrack) {
            return;
        }

        const nextEnabled = !videoTrack.enabled;
        videoTrack.enabled = nextEnabled;
        setIsCameraOff(!nextEnabled);

        if (localPreviewRef.current) {
            localPreviewRef.current.srcObject = nextEnabled ? localVideoStreamRef.current : null;
        }
    }, []);

    const interruptAvatar = useCallback(() => {
        const activeSession = sessionRef.current;

        if (!activeSession || status !== "connected") {
            return;
        }

        try {
            activeSession.interrupt();
            activeSession.startListening();
        } catch (interruptError) {
            console.error("Failed to interrupt avatar:", interruptError);
        }
    }, [status]);

    const formatDurationLong = (seconds: number): string => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        return `${hours.toString().padStart(2, "0")}:${minutes
            .toString()
            .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    const formatDurationShort = (seconds: number): string => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;

        return `${minutes}:${secs.toString().padStart(2, "0")}`;
    };

    if (status === "loading") {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-[#E8EEFF]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
                    <p className="text-gray-600">Préparation de la session coach...</p>
                </div>
            </div>
        );
    }

    if (status === "error") {
        return (
            <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-[#E8EEFF] p-6">
                <AlertCircle className="h-16 w-16 text-red-500" />
                <p className="max-w-md text-center text-red-500">{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="rounded-lg bg-blue-500 px-6 py-2 text-white hover:bg-blue-600"
                >
                    Réessayer
                </button>
            </div>
        );
    }

    if (!config) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-[#E8EEFF]">
                <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
            </div>
        );
    }

    if (status === "ended") {
        return (
            <div className="flex h-screen w-full flex-col items-center justify-center gap-6 bg-[#E8EEFF]">
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-green-500 shadow-lg">
                    <span className="text-5xl text-white">✓</span>
                </div>
                <div className="text-center">
                    <p className="mb-2 text-2xl font-bold text-gray-900">Appel terminé</p>
                    <p className="text-lg text-gray-500">Durée : {formatDurationShort(sessionDuration)}</p>
                </div>
            </div>
        );
    }

    const isSessionActive = status === "connecting" || status === "connected";

    return (
        <div className="relative flex h-screen w-full flex-row overflow-hidden bg-white font-sans">
            <div className="flex flex-1 flex-col overflow-hidden">
                <div className="relative m-4 flex-1 overflow-hidden rounded-3xl shadow-inner">
                    <div
                        className="absolute inset-0 bg-center bg-cover bg-no-repeat"
                        style={{
                            backgroundImage: config.avatarUrl
                                ? `linear-gradient(180deg, rgba(15,23,42,0.08) 0%, rgba(15,23,42,0.24) 100%), url(${config.avatarUrl})`
                                : "url(/bg_coach_ai.png)",
                        }}
                    />

                    <video
                        ref={avatarVideoRef}
                        autoPlay
                        playsInline
                        className="absolute inset-0 h-full w-full object-cover bg-[#0F172A]"
                    />

                    <div
                        className="absolute inset-0"
                        style={{
                            background:
                                "linear-gradient(180deg, rgba(15,23,42,0.18) 0%, rgba(15,23,42,0.1) 35%, rgba(15,23,42,0.3) 100%)",
                        }}
                    />

                    <div className="absolute left-2 top-2 z-20 flex items-center gap-1.5 rounded-lg bg-[#333C4E] px-3 py-1.5 text-white shadow-lg">
                        <svg className="h-4 w-4 text-gray-300" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 3a9 9 0 1 0 9 9 9 9 0 0 0-9-9Zm-1 5h2v5h-2Zm0 7h2v2h-2Z" />
                        </svg>
                        <span className="text-sm font-medium">{coachDisplayName}</span>
                    </div>

                    {!isSessionActive && (
                        <div
                            className="absolute inset-0 z-10"
                            style={{ background: "rgba(15, 23, 42, 0.22)", backdropFilter: "blur(4px)" }}
                        />
                    )}

                    {status === "ready" && (
                        <div className="absolute inset-0 z-20 flex items-center justify-center px-4">
                            <div className="flex w-full max-w-md flex-col items-center rounded-2xl bg-white/92 px-6 py-7 text-center shadow-xl backdrop-blur">
                                <div className="mb-3 text-[#00D64F]">
                                    <Phone className="h-12 w-12" />
                                </div>
                                <h2 className="mb-1 text-lg font-medium text-gray-900">Coach en attente</h2>
                                <p className="mb-5 text-sm text-gray-500">{config.scenarioTitle}</p>
                                <button
                                    onClick={startSession}
                                    className="mb-3 flex items-center gap-2 rounded-lg bg-[#00D64F] px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-[#00c046] hover:shadow-md"
                                >
                                    <Phone className="h-4 w-4" />
                                    Démarrer la conversation
                                </button>
                            </div>
                        </div>
                    )}

                    {status === "connecting" && (
                        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/20">
                            <div className="flex items-center gap-3 rounded-full bg-white/90 px-5 py-3 shadow-lg">
                                <Loader2 className="h-5 w-5 animate-spin text-[#4F46E5]" />
                                <span className="text-sm font-medium text-gray-900">Connexion au coach avatar...</span>
                            </div>
                        </div>
                    )}

                    {status === "connected" && isAiSpeaking && (
                        <div className="absolute left-1/2 top-8 z-10 -translate-x-1/2 rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-[#4F46E5] shadow">
                            Le coach parle
                        </div>
                    )}

                    <div className="absolute bottom-4 right-4 z-20 flex h-40 w-56 items-center justify-center overflow-hidden rounded-xl bg-[#1E293B] shadow-lg">
                        <div className="absolute left-2.5 top-2.5 z-10 flex items-center gap-1.5 rounded-md bg-black/40 px-2.5 py-1">
                            <Camera className="h-4 w-4 text-white/70" />
                            <span className="text-sm font-medium text-white/90">Vous</span>
                        </div>

                        {isSessionActive && hasVideoStream && !isCameraOff ? (
                            <video
                                ref={localPreviewRef}
                                autoPlay
                                playsInline
                                muted
                                className="h-full w-full scale-x-[-1] object-cover"
                            />
                        ) : (
                            <VideoOff className="h-12 w-12 text-gray-500" />
                        )}

                        <div
                            className={`absolute bottom-2.5 right-2.5 flex h-7 w-7 items-center justify-center rounded-full ${
                                isSessionActive && !isMicMuted ? "bg-green-500" : "bg-red-500"
                            }`}
                        >
                            {isSessionActive && !isMicMuted ? (
                                <svg className="h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                                </svg>
                            ) : (
                                <MicOff className="h-3.5 w-3.5 text-white" />
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-center gap-3 px-3 py-2">
                    {status !== "ready" && (
                        <>
                            <div className="flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5">
                                <svg className="h-4 w-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" />
                                    <polyline points="12 6 12 12 16 14" />
                                </svg>
                                <span className="font-mono text-sm font-medium tabular-nums text-gray-700">
                                    {formatDurationLong(sessionDuration)}
                                </span>
                            </div>

                            <button
                                onClick={() => void toggleMic()}
                                className={`flex h-11 w-11 items-center justify-center rounded-full text-white shadow-md transition-all ${
                                    isMicMuted ? "bg-red-500 hover:bg-red-600" : "bg-[#00D64F] hover:bg-[#00c046]"
                                }`}
                            >
                                {isMicMuted ? (
                                    <MicOff className="h-5 w-5" />
                                ) : (
                                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                                        <path d="M19 10v2a7 7 0 0 1-14 0v-2" fill="none" stroke="currentColor" strokeWidth="2" />
                                        <line x1="12" y1="19" x2="12" y2="23" stroke="currentColor" strokeWidth="2" />
                                        <line x1="8" y1="23" x2="16" y2="23" stroke="currentColor" strokeWidth="2" />
                                    </svg>
                                )}
                            </button>

                            <button
                                onClick={toggleCamera}
                                className={`flex h-11 w-11 items-center justify-center rounded-full text-white shadow-md transition-all ${
                                    isCameraOff ? "bg-red-500 hover:bg-red-600" : "bg-[#00D64F] hover:bg-[#00c046]"
                                }`}
                            >
                                {isCameraOff ? <VideoOff className="h-5 w-5" /> : <Camera className="h-5 w-5" />}
                            </button>

                            <button
                                onClick={interruptAvatar}
                                disabled={status !== "connected"}
                                className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-all hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                                    <rect x="6" y="4" width="4" height="16" rx="1" />
                                    <rect x="14" y="4" width="4" height="16" rx="1" />
                                </svg>
                            </button>

                            <button
                                onClick={() => void endSession()}
                                disabled={status !== "connected"}
                                className="flex h-11 w-11 items-center justify-center rounded-full bg-red-500 text-white shadow-md transition-all hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-red-300"
                            >
                                <PhoneOff className="h-5 w-5" />
                            </button>
                        </>
                    )}
                </div>
            </div>

            <CoachRealtimePanel
                coachName={coachDisplayName}
                isSessionActive={isSessionActive}
                isUserSpeaking={isUserSpeaking}
                messages={liveMessages}
                userDraft={userDraft}
                assistantDraft={assistantDraft}
            />
        </div>
    );
}
