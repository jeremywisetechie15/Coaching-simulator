"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
    Mic,
    MicOff,
    Phone,
    PhoneOff,
    Loader2,
    Volume2,
    VolumeX,
    AlertCircle,
    Waves,
    MessageSquare,
    User,
    Bot,
    Copy,
    Check,
    X,
    ChevronDown
} from "lucide-react";
import type { Scenario, VoiceId } from "@/types";
import { DEFAULT_OPENAI_REALTIME_VOICE_ID, OPENAI_REALTIME_VOICES } from "@/lib/openai/realtime-voices";

interface VoiceSessionProps {
    scenario: Scenario;
    model?: string;
}

type SessionStatus = "idle" | "connecting" | "connected" | "error" | "disconnected";

interface ConversationMessage {
    role: "user" | "assistant";
    content: string;
    timestamp: string;
}

export default function VoiceSession({ scenario, model = "gpt-4o-mini-realtime-preview" }: VoiceSessionProps) {
    const [status, setStatus] = useState<SessionStatus>("idle");
    const [error, setError] = useState<string | null>(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isAiSpeaking, setIsAiSpeaking] = useState(false);
    const [volume, setVolume] = useState(1);
    const [sessionDuration, setSessionDuration] = useState(0);
    const [currentVoice, setCurrentVoice] = useState<VoiceId>(DEFAULT_OPENAI_REALTIME_VOICE_ID);
    const [selectedVoice, setSelectedVoice] = useState<VoiceId>(DEFAULT_OPENAI_REALTIME_VOICE_ID);
    const [showVoiceDropdown, setShowVoiceDropdown] = useState(false);

    // UI state for transcript display
    const [showTranscript, setShowTranscript] = useState(false);
    const [copied, setCopied] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [savedSessionId, setSavedSessionId] = useState<string | null>(null);

    // Display conversation (updated from ref for UI)
    const [displayConversation, setDisplayConversation] = useState<ConversationMessage[]>([]);
    const [messageCount, setMessageCount] = useState(0);

    // WebRTC refs
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
    const dataChannelRef = useRef<RTCDataChannel | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const audioElementRef = useRef<HTMLAudioElement | null>(null);
    const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // CRITICAL: Store conversation in ref to avoid duplicates
    // This is the single source of truth during the session
    const conversationRef = useRef<ConversationMessage[]>([]);
    const sessionDurationRef = useRef<number>(0);

    // Track processed event IDs to prevent duplicates
    const processedEventIds = useRef<Set<string>>(new Set());

    const cleanup = useCallback(() => {
        if (durationIntervalRef.current) {
            clearInterval(durationIntervalRef.current);
            durationIntervalRef.current = null;
        }
        if (dataChannelRef.current) {
            dataChannelRef.current.close();
            dataChannelRef.current = null;
        }
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
            localStreamRef.current = null;
        }
        if (audioElementRef.current) {
            audioElementRef.current.srcObject = null;
        }
        setIsAiSpeaking(false);
    }, []);

    useEffect(() => {
        return () => cleanup();
    }, [cleanup]);

    // Add message to conversation ref (with duplicate check)
    const addMessageToRef = useCallback((role: "user" | "assistant", content: string, eventId?: string) => {
        // Skip empty content
        if (!content || !content.trim()) {
            console.log("⏭️ Skipping empty message");
            return;
        }

        // Skip if we already processed this event
        if (eventId && processedEventIds.current.has(eventId)) {
            console.log("⏭️ Skipping duplicate event:", eventId);
            return;
        }

        // Mark event as processed
        if (eventId) {
            processedEventIds.current.add(eventId);
        }

        const trimmedContent = content.trim();

        // Check for duplicate content (last message same role and content)
        const lastMessage = conversationRef.current[conversationRef.current.length - 1];
        if (lastMessage && lastMessage.role === role && lastMessage.content === trimmedContent) {
            console.log("⏭️ Skipping duplicate content");
            return;
        }

        const newMessage: ConversationMessage = {
            role,
            content: trimmedContent,
            timestamp: new Date().toISOString(),
        };

        conversationRef.current.push(newMessage);
        setMessageCount(conversationRef.current.length);

        console.log(`💬 ${role === "user" ? "👤 User" : "🤖 AI"}: ${trimmedContent.substring(0, 50)}...`);
    }, []);

    const startSession = async () => {
        try {
            setStatus("connecting");
            setError(null);
            setSessionDuration(0);
            sessionDurationRef.current = 0;
            setShowTranscript(false);
            setSavedSessionId(null);
            setMessageCount(0);
            setDisplayConversation([]);

            // Reset conversation ref
            conversationRef.current = [];
            processedEventIds.current.clear();

            const stream = await navigator.mediaDevices.getUserMedia({
                audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
            });
            localStreamRef.current = stream;

            const response = await fetch("/api/realtime-session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    persona_id: scenario.persona_id,
                    voice: selectedVoice,
                    model: model  // Use selected model
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to get session token");
            }

            const { data, voice, model: responseModel } = await response.json();
            const ephemeralKey = data.client_secret.value;
            const activeModel = responseModel || model;
            setCurrentVoice(voice);

            const pc = new RTCPeerConnection({
                iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
            });
            peerConnectionRef.current = pc;

            const audioEl = document.createElement("audio");
            audioEl.autoplay = true;
            audioEl.volume = volume;
            audioElementRef.current = audioEl;

            pc.ontrack = (event) => {
                audioEl.srcObject = event.streams[0];
            };

            stream.getTracks().forEach(track => pc.addTrack(track, stream));

            const dataChannel = pc.createDataChannel("oai-events");
            dataChannelRef.current = dataChannel;

            // When data channel opens, trigger AI to start speaking
            dataChannel.onopen = () => {
                console.log("📡 Data channel opened, triggering AI greeting...");

                // Send initial message to make AI start in character
                const initialMessage = {
                    type: "conversation.item.create",
                    item: {
                        type: "message",
                        role: "user",
                        content: [
                            {
                                type: "input_text",
                                text: "La simulation commence. Mets-toi directement dans ton personnage et commence la scène. Joue ton rôle immédiatement."
                            }
                        ]
                    }
                };
                dataChannel.send(JSON.stringify(initialMessage));

                // Trigger response
                dataChannel.send(JSON.stringify({ type: "response.create" }));
            };

            dataChannel.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    handleRealtimeEvent(message);
                } catch (e) {
                    console.error("Failed to parse message:", e);
                }
            };

            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            const sdpResponse = await fetch(
                `https://api.openai.com/v1/realtime?model=${activeModel}`,
                {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${ephemeralKey}`,
                        "Content-Type": "application/sdp",
                    },
                    body: offer.sdp,
                }
            );

            if (!sdpResponse.ok) throw new Error(`Failed to connect: ${sdpResponse.status}`);

            const answerSdp = await sdpResponse.text();
            await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });

            pc.onconnectionstatechange = () => {
                if (pc.connectionState === "connected") {
                    setStatus("connected");
                    durationIntervalRef.current = setInterval(() => {
                        sessionDurationRef.current += 1;
                        setSessionDuration(prev => prev + 1);
                    }, 1000);
                } else if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
                    setStatus("disconnected");
                    cleanup();
                }
            };

        } catch (err) {
            console.error("Session error:", err);
            setError(err instanceof Error ? err.message : "Failed to start session");
            setStatus("error");
            cleanup();
        }
    };

    // CRITICAL: Only listen to COMPLETED/DONE events, not deltas
    const handleRealtimeEvent = useCallback((event: { type: string;[key: string]: unknown }) => {
        const eventId = (event as { event_id?: string }).event_id;

        switch (event.type) {
            // ✅ USER SPEECH - Final transcript only
            case "conversation.item.input_audio_transcription.completed": {
                const transcript = (event as { transcript?: string }).transcript;
                if (transcript) {
                    addMessageToRef("user", transcript, eventId);
                }
                break;
            }

            // ✅ AI RESPONSE - Final transcript only
            case "response.audio_transcript.done": {
                const transcript = (event as { transcript?: string }).transcript;
                if (transcript) {
                    addMessageToRef("assistant", transcript, eventId);
                }
                break;
            }

            // Visual feedback only (no storage)
            case "response.audio.delta":
                setIsAiSpeaking(true);
                break;

            case "response.audio.done":
            case "response.done":
                setIsAiSpeaking(false);
                break;

            case "error":
                console.error("Realtime API error:", event);
                setError(String((event as { error?: { message?: string } }).error?.message) || "An error occurred");
                break;

            // Ignore all other events (deltas, partials, etc.)
            default:
                // Uncomment for debugging:
                // console.log("📨 Event:", event.type);
                break;
        }
    }, [addMessageToRef]);

    // Save session to database - ONLY ONCE at the end
    const saveSession = useCallback(async () => {
        const conversation = conversationRef.current;
        const duration = sessionDurationRef.current;

        if (conversation.length === 0) {
            console.log("⏭️ No conversation to save");
            return;
        }

        setIsSaving(true);
        try {
            const response = await fetch("/api/save-session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    scenario_id: scenario.id,
                    duration_seconds: duration,
                    messages: conversation,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                setSavedSessionId(data.session_id);
                console.log("✅ Session saved:", data.session_id, `(${conversation.length} messages)`);
            } else {
                const errorData = await response.json();
                console.error("Failed to save session:", errorData.error);
            }
        } catch (err) {
            console.error("Error saving session:", err);
        } finally {
            setIsSaving(false);
        }
    }, [scenario.id]);

    const stopSession = async () => {
        // Capture conversation from ref before cleanup
        const finalConversation = [...conversationRef.current];

        cleanup();
        setStatus("disconnected");

        // Update display conversation for UI
        setDisplayConversation(finalConversation);

        // Show transcript if we have conversation
        if (finalConversation.length > 0) {
            setShowTranscript(true);
            // Save to database ONCE
            await saveSession();
        }
    };

    const toggleMute = () => {
        if (localStreamRef.current) {
            const audioTrack = localStreamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMuted(!audioTrack.enabled);
            }
        }
    };

    const toggleAiAudio = () => {
        if (audioElementRef.current) {
            const newVolume = audioElementRef.current.volume > 0 ? 0 : 1;
            audioElementRef.current.volume = newVolume;
            setVolume(newVolume);
        }
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    const formatTime = (isoString: string) => {
        return new Date(isoString).toLocaleTimeString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        });
    };

    const copyTranscript = () => {
        const text = displayConversation
            .map(msg => `[${formatTime(msg.timestamp)}] ${msg.role === "user" ? "Vous" : scenario.title}: ${msg.content}`)
            .join("\n\n");

        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const SoundWave = () => (
        <div className="sound-wave flex items-center justify-center gap-1 h-16">
            <span style={{ animationDelay: "0s" }} />
            <span style={{ animationDelay: "0.1s" }} />
            <span style={{ animationDelay: "0.2s" }} />
            <span style={{ animationDelay: "0.3s" }} />
            <span style={{ animationDelay: "0.4s" }} />
        </div>
    );

    // Transcript Modal
    if (showTranscript && displayConversation.length > 0) {
        return (
            <div className="flex flex-col items-center px-4 py-8 min-h-[calc(100vh-120px)]">
                <div className="w-full max-w-2xl">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                                <MessageSquare className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Transcription</h2>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <p className="text-sm text-gray-400">
                                        {scenario.title} • {formatDuration(sessionDuration)} • {displayConversation.length} messages
                                    </p>
                                    {isSaving ? (
                                        <span className="flex items-center gap-1 text-xs text-amber-400">
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                            Sauvegarde...
                                        </span>
                                    ) : savedSessionId ? (
                                        <span className="flex items-center gap-1 text-xs text-green-400">
                                            <Check className="w-3 h-3" />
                                            Sauvegardé
                                        </span>
                                    ) : null}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={copyTranscript}
                                className="flex items-center gap-2 px-4 py-2 glass-card rounded-lg hover:bg-white/10 transition-colors"
                            >
                                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-400" />}
                                <span className="text-sm text-gray-300">{copied ? "Copié !" : "Copier"}</span>
                            </button>
                            <button
                                onClick={() => setShowTranscript(false)}
                                className="p-2 glass-card rounded-lg hover:bg-white/10 transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>
                    </div>

                    {/* Conversation */}
                    <div className="glass-card rounded-2xl p-4 sm:p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                        {displayConversation.map((msg, index) => (
                            <div
                                key={`${msg.timestamp}-${index}`}
                                className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                            >
                                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${msg.role === "user" ? "bg-blue-500/20 text-blue-400" : "bg-purple-500/20 text-purple-400"
                                    }`}>
                                    {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                                </div>
                                <div className={`flex-1 ${msg.role === "user" ? "text-right" : ""}`}>
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        <span className={`text-xs font-medium ${msg.role === "user" ? "text-blue-400 order-2" : "text-purple-400"
                                            }`}>
                                            {msg.role === "user" ? "Vous" : scenario.title}
                                        </span>
                                        <span className="text-xs text-gray-600">{formatTime(msg.timestamp)}</span>
                                    </div>
                                    <div className={`inline-block px-4 py-2 rounded-2xl text-sm leading-relaxed ${msg.role === "user"
                                        ? "bg-blue-500/20 text-blue-100 rounded-tr-sm"
                                        : "bg-white/5 text-gray-200 rounded-tl-sm"
                                        }`}>
                                        {msg.content}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Actions */}
                    <div className="flex justify-center gap-4 mt-6">
                        <button
                            onClick={() => {
                                setShowTranscript(false);
                                setDisplayConversation([]);
                                setMessageCount(0);
                                setStatus("idle");
                            }}
                            className="px-6 py-3 glass-card rounded-full hover:bg-white/10 transition-colors text-gray-300"
                        >
                            Nouvelle session
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-120px)] min-h-[calc(100dvh-120px)] px-4 py-8">
            {/* Main Visual Orb */}
            <div className="relative mb-8 sm:mb-12">
                {status === "connected" && isAiSpeaking && (
                    <>
                        <div className="absolute inset-0 rounded-full animate-ping opacity-20 bg-green-500"
                            style={{ animationDuration: "1.5s" }} />
                        <div className="absolute -inset-4 rounded-full animate-pulse opacity-10 bg-green-400" />
                    </>
                )}

                <div
                    className={`
            relative w-40 h-40 sm:w-52 sm:h-52 lg:w-64 lg:h-64 rounded-full 
            flex flex-col items-center justify-center
            transition-all duration-700 ease-out
            ${status === "connected"
                            ? isAiSpeaking
                                ? "bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600 glow-green scale-105"
                                : "bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-600 glow-blue"
                            : status === "connecting"
                                ? "bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 animate-pulse"
                                : status === "error"
                                    ? "bg-gradient-to-br from-red-400 via-rose-500 to-pink-600 glow-red"
                                    : "bg-gradient-to-br from-gray-600 via-gray-700 to-gray-800"
                        }
          `}
                >
                    {status === "connecting" ? (
                        <Loader2 className="w-12 h-12 sm:w-16 sm:h-16 text-white animate-spin" />
                    ) : status === "connected" ? (
                        <div className="text-center">
                            {isAiSpeaking ? <SoundWave /> : (
                                <Waves className="w-12 h-12 sm:w-16 sm:h-16 text-white/80 mx-auto animate-pulse" />
                            )}
                            <span className="text-white text-sm sm:text-base mt-3 block font-medium">
                                {isAiSpeaking ? "IA parle..." : "À l'écoute"}
                            </span>
                        </div>
                    ) : status === "error" ? (
                        <div className="text-center">
                            <AlertCircle className="w-12 h-12 sm:w-16 sm:h-16 text-white mx-auto" />
                            <span className="text-white text-sm mt-2 block">Erreur</span>
                        </div>
                    ) : (
                        <div className="text-center">
                            <Mic className="w-12 h-12 sm:w-16 sm:h-16 text-white/40 mx-auto" />
                            <span className="text-white/40 text-sm mt-2 block">Prêt</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Scenario Info */}
            <div className="text-center mb-6 sm:mb-8 max-w-md px-4">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-2">
                    {scenario.title}
                </h1>
                <p className="text-sm sm:text-base text-gray-400">{scenario.description}</p>

                {/* Voice Selector - Only show when idle or disconnected */}
                {(status === "idle" || status === "disconnected" || status === "error") && (
                    <div className="relative mt-4">
                        <button
                            onClick={() => setShowVoiceDropdown(!showVoiceDropdown)}
                            className="flex items-center justify-center gap-2 mx-auto px-4 py-2 glass-card rounded-xl hover:bg-white/10 transition-all"
                        >
                            <span className="text-sm text-gray-300">
                                Voix: <span className="text-white font-medium">
                                    {OPENAI_REALTIME_VOICES.find(v => v.id === selectedVoice)?.name || selectedVoice}
                                </span>
                            </span>
                            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showVoiceDropdown ? "rotate-180" : ""}`} />
                        </button>

                        {showVoiceDropdown && (
                            <div className="absolute z-[100] mt-2 left-1/2 -translate-x-1/2 w-64 bg-gray-900 border border-gray-700 rounded-xl overflow-hidden shadow-2xl shadow-black/50">
                                <div className="max-h-64 overflow-y-auto">
                                    {OPENAI_REALTIME_VOICES.map((voice) => (
                                        <button
                                            key={voice.id}
                                            onClick={() => {
                                                setSelectedVoice(voice.id);
                                                setShowVoiceDropdown(false);
                                            }}
                                            className={`w-full px-4 py-3 text-left hover:bg-white/10 transition-colors flex items-center gap-3 ${selectedVoice === voice.id ? "bg-blue-500/20" : ""
                                                }`}
                                        >
                                            <div className="flex-1">
                                                <p className={`flex items-center gap-2 text-sm font-medium ${selectedVoice === voice.id ? "text-blue-300" : "text-white"}`}>
                                                    {voice.name}
                                                    {voice.recommended && (
                                                        <span className="rounded bg-blue-500/20 px-1.5 py-0.5 text-[10px] text-blue-300">
                                                            Recommandée
                                                        </span>
                                                    )}
                                                </p>
                                                <p className="text-xs text-gray-500">{voice.characteristic}</p>
                                            </div>
                                            {selectedVoice === voice.id && (
                                                <Check className="w-4 h-4 text-blue-400" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Voice badge when connected */}
                {currentVoice && status === "connected" && (
                    <div className="flex items-center justify-center gap-2 mt-3">
                        <span className="px-2 py-1 text-xs bg-white/5 rounded-full text-gray-500">
                            Voice: {currentVoice}
                        </span>
                        {messageCount > 0 && (
                            <span className="px-2 py-1 text-xs bg-blue-500/20 rounded-full text-blue-400">
                                {messageCount} messages
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Timer */}
            {status === "connected" && (
                <div className="text-3xl sm:text-4xl font-mono font-bold text-white mb-8 tabular-nums">
                    {formatDuration(sessionDuration)}
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="glass-card rounded-xl px-4 py-3 max-w-sm mb-6 border-red-500/30 bg-red-500/10">
                    <p className="text-red-400 text-sm text-center">{error}</p>
                </div>
            )}

            {/* Control Buttons */}
            <div className="flex flex-wrap justify-center items-center gap-3 sm:gap-4">
                {status === "idle" || status === "disconnected" || status === "error" ? (
                    <button
                        onClick={startSession}
                        className="group flex items-center gap-3 px-8 sm:px-10 py-4 sm:py-5
                     bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500
                     hover:from-green-400 hover:via-emerald-400 hover:to-teal-400
                     text-white font-semibold rounded-full 
                     transition-all duration-300 
                     shadow-lg shadow-green-500/25 hover:shadow-green-500/40
                     hover:scale-105 active:scale-95
                     text-base sm:text-lg"
                    >
                        <Phone className="w-5 h-5 sm:w-6 sm:h-6 group-hover:rotate-12 transition-transform" />
                        <span>Démarrer</span>
                    </button>
                ) : status === "connecting" ? (
                    <button
                        disabled
                        className="flex items-center gap-3 px-8 sm:px-10 py-4 sm:py-5
                     bg-gray-700 text-gray-400 font-semibold rounded-full 
                     cursor-not-allowed text-base sm:text-lg"
                    >
                        <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
                        <span>Connexion...</span>
                    </button>
                ) : (
                    <div className="flex items-center gap-3 sm:gap-4">
                        <button
                            onClick={toggleMute}
                            className={`p-4 sm:p-5 rounded-full transition-all duration-300 active:scale-90
                ${isMuted
                                    ? "bg-red-500/20 text-red-400 border border-red-500/30 shadow-lg shadow-red-500/20"
                                    : "glass-card text-white hover:bg-white/10"
                                }`}
                            title={isMuted ? "Activer micro" : "Couper micro"}
                        >
                            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                        </button>

                        <button
                            onClick={toggleAiAudio}
                            className={`p-4 sm:p-5 rounded-full transition-all duration-300 active:scale-90
                ${volume === 0
                                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-lg shadow-amber-500/20"
                                    : "glass-card text-white hover:bg-white/10"
                                }`}
                            title={volume === 0 ? "Activer son IA" : "Couper son IA"}
                        >
                            {volume === 0 ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                        </button>

                        <button
                            onClick={stopSession}
                            className="flex items-center gap-2 px-6 sm:px-8 py-4 sm:py-5
                       bg-gradient-to-r from-red-500 via-rose-500 to-pink-500
                       hover:from-red-400 hover:via-rose-400 hover:to-pink-400
                       text-white font-semibold rounded-full 
                       transition-all duration-300 
                       shadow-lg shadow-red-500/25 hover:shadow-red-500/40
                       hover:scale-105 active:scale-95"
                        >
                            <PhoneOff className="w-5 h-5 sm:w-6 sm:h-6" />
                            <span className="hidden sm:inline">Terminer</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Status Indicator */}
            <div className="flex items-center gap-2 mt-8 text-sm text-gray-500">
                <div className={`w-2.5 h-2.5 rounded-full transition-colors duration-300 ${status === "connected" ? "bg-green-500 shadow-lg shadow-green-500/50" :
                    status === "connecting" ? "bg-amber-500 animate-pulse" :
                        status === "error" ? "bg-red-500" :
                            "bg-gray-600"
                    }`} />
                <span>
                    {status === "idle" && "Prêt à démarrer"}
                    {status === "connecting" && "Établissement de la connexion..."}
                    {status === "connected" && "Session en cours"}
                    {status === "disconnected" && "Session terminée"}
                    {status === "error" && "Erreur de connexion"}
                </span>
            </div>

            {status === "idle" && (
                <p className="text-center text-gray-500 text-sm mt-6 max-w-xs px-4">
                    Cliquez sur Démarrer et autorisez l&apos;accès au microphone
                </p>
            )}
        </div>
    );
}
