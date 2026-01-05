"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Phone, PhoneOff, Loader2, AlertCircle, Waves, Volume2, Camera, VideoOff, MicOff } from "lucide-react";
import { prepareIframeSession, type IframeSessionConfig } from "./actions";
import type { VoiceId } from "@/types";

type SessionStatus = "loading" | "ready" | "connecting" | "connected" | "error" | "ended";

interface ConversationMessage {
    role: "user" | "assistant";
    content: string;
    timestamp: string;
}

interface IframeClientProps {
    scenarioId: string;
    mode: string;
    refSessionId?: string;
    model: string;
}

export default function IframeClient({ scenarioId, mode, refSessionId, model }: IframeClientProps) {
    const [status, setStatus] = useState<SessionStatus>("loading");
    const [error, setError] = useState<string | null>(null);
    const [config, setConfig] = useState<IframeSessionConfig | null>(null);
    const [isAiSpeaking, setIsAiSpeaking] = useState(false);
    const [sessionDuration, setSessionDuration] = useState(0);

    // WebRTC refs
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
    const dataChannelRef = useRef<RTCDataChannel | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const audioElementRef = useRef<HTMLAudioElement | null>(null);
    const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const ringtoneRef = useRef<{ stop: () => void } | null>(null);

    // Conversation tracking
    const conversationRef = useRef<ConversationMessage[]>([]);
    const processedEventIds = useRef<Set<string>>(new Set());
    const sessionDurationRef = useRef<number>(0);
    const initCalledRef = useRef(false);
    const speakingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Generate realistic European phone ringtone using Web Audio API
    const playRingtone = useCallback(() => {
        const audioContext = new (window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)();
        let isPlaying = true;

        const createRingTone = (startTime: number) => {
            // European phone ring - two tones at 425Hz with cadence
            const frequencies = [425, 450]; // Dual tone
            const oscillators: OscillatorNode[] = [];
            const gainNode = audioContext.createGain();
            gainNode.connect(audioContext.destination);

            frequencies.forEach(freq => {
                const osc = audioContext.createOscillator();
                osc.frequency.value = freq;
                osc.type = 'sine';
                osc.connect(gainNode);
                oscillators.push(osc);
            });

            // Ring pattern: 0.4s on, 0.2s off, 0.4s on, then 2s pause
            const ringDuration = 0.4;
            const pauseBetween = 0.2;

            // Fade in
            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(0.15, startTime + 0.02);

            // First ring
            gainNode.gain.setValueAtTime(0.15, startTime + ringDuration - 0.02);
            gainNode.gain.linearRampToValueAtTime(0, startTime + ringDuration);

            // Pause
            gainNode.gain.setValueAtTime(0, startTime + ringDuration + pauseBetween);

            // Second ring
            gainNode.gain.linearRampToValueAtTime(0.15, startTime + ringDuration + pauseBetween + 0.02);
            gainNode.gain.setValueAtTime(0.15, startTime + ringDuration * 2 + pauseBetween - 0.02);
            gainNode.gain.linearRampToValueAtTime(0, startTime + ringDuration * 2 + pauseBetween);

            oscillators.forEach(osc => {
                osc.start(startTime);
                osc.stop(startTime + ringDuration * 2 + pauseBetween + 0.1);
            });
        };

        // Play first ring immediately
        createRingTone(audioContext.currentTime);

        // Repeat every 3 seconds
        const interval = setInterval(() => {
            if (!isPlaying) return;
            createRingTone(audioContext.currentTime);
        }, 3000);

        ringtoneRef.current = {
            stop: () => {
                isPlaying = false;
                clearInterval(interval);
                audioContext.close();
            }
        };
    }, []);

    // Inject CSS keyframes for wave animation
    useEffect(() => {
        const styleId = 'wave-animation-styles';
        if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            style.textContent = `
                @keyframes wave-expand {
                    0% {
                        transform: scale(1);
                        opacity: 0.6;
                    }
                    100% {
                        transform: scale(1.4);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
        return () => {
            const style = document.getElementById(styleId);
            if (style) style.remove();
        };
    }, []);

    // Initialize on mount - with guard to prevent double init (React Strict Mode)
    // Initialize on mount - prepare config (NO session created yet)
    useEffect(() => {
        if (initCalledRef.current) return;
        initCalledRef.current = true;

        const init = async () => {
            try {
                const result = await prepareIframeSession({
                    scenarioId,
                    mode: mode as "standard" | "coach",
                    refSessionId,
                    model,
                });

                if (!result.success || !result.data) {
                    throw new Error(result.error || "Failed to prepare session config");
                }

                setConfig(result.data);
                setStatus("ready");
            } catch (err) {
                setError(err instanceof Error ? err.message : "Initialization error");
                setStatus("error");
            }
        }
        init();
    }, [scenarioId, mode, refSessionId, model]);

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

    // Add message to ref (no DB save - done at the end)
    const addMessageToRef = useCallback((role: "user" | "assistant", content: string, eventId?: string) => {
        if (!content?.trim()) return;
        if (eventId && processedEventIds.current.has(eventId)) return;
        if (eventId) processedEventIds.current.add(eventId);

        const trimmedContent = content.trim();
        const lastMessage = conversationRef.current[conversationRef.current.length - 1];
        if (lastMessage && lastMessage.role === role && lastMessage.content === trimmedContent) return;

        conversationRef.current.push({
            role,
            content: trimmedContent,
            timestamp: new Date().toISOString(),
        });

        console.log(`💬 ${role === "user" ? "👤 User" : "🤖 AI"}: ${trimmedContent.substring(0, 50)}...`);
    }, []);

    const handleRealtimeEvent = useCallback((event: { type: string;[key: string]: unknown }) => {
        const eventId = (event as { event_id?: string }).event_id;

        switch (event.type) {
            // === TRANSCRIPTION EVENTS ===
            case "conversation.item.input_audio_transcription.completed": {
                const transcript = (event as { transcript?: string }).transcript;
                if (transcript) addMessageToRef("user", transcript, eventId);
                break;
            }
            case "response.audio_transcript.done": {
                const transcript = (event as { transcript?: string }).transcript;
                if (transcript) addMessageToRef("assistant", transcript, eventId);
                break;
            }

            // === AI SPEAKING EVENTS (WebRTC) ===
            case "output_audio_buffer.started":
                console.log("🟢 AI STARTED SPEAKING (output_audio_buffer.started)");
                setIsAiSpeaking(true);
                break;

            case "output_audio_buffer.stopped":
                console.log("🔴 AI STOPPED SPEAKING (output_audio_buffer.stopped)");
                setIsAiSpeaking(false);
                break;

            case "output_audio_buffer.cleared":
                console.log("🟠 AI INTERRUPTED (output_audio_buffer.cleared)");
                setIsAiSpeaking(false);
                break;

            // === FALLBACK for WebSocket mode ===
            case "response.audio.delta":
                console.log("🔵 Audio delta received");
                setIsAiSpeaking(true);
                break;

            // NOTE: response.audio.done fires before output_audio_buffer.stopped
            // so we ignore it and rely on output_audio_buffer.stopped for WebRTC
            case "response.audio.done":
                console.log("⚪ Audio done (ignored - waiting for output_audio_buffer.stopped)");
                // Don't set isAiSpeaking to false here!
                break;

            // === ERROR ===
            case "error":
                setError(String((event as { error?: { message?: string } }).error?.message) || "Error");
                break;

            // === LOG ALL OTHER AUDIO-RELATED EVENTS ===
            default:
                if (event.type.includes("audio") || event.type.includes("output") || event.type.includes("speech")) {
                    console.log("📡 Other audio event:", event.type);
                }
        }
    }, [addMessageToRef]);

    const startSession = async () => {
        if (!config) return;

        try {
            setStatus("connecting");
            setError(null);
            conversationRef.current = [];
            processedEventIds.current.clear();

            // Start playing ringtone
            playRingtone();

            // Get microphone
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            localStreamRef.current = stream;

            // Create peer connection
            const pc = new RTCPeerConnection();
            peerConnectionRef.current = pc;

            // Add audio track
            stream.getTracks().forEach(track => pc.addTrack(track, stream));

            // Audio element for remote audio
            const audioEl = document.createElement("audio");
            audioEl.autoplay = true;
            audioElementRef.current = audioEl;

            pc.ontrack = (e) => {
                audioEl.srcObject = e.streams[0];
            };

            // Data channel for events
            const dc = pc.createDataChannel("oai-events");
            dataChannelRef.current = dc;

            dc.onmessage = (e) => {
                try {
                    const event = JSON.parse(e.data);
                    handleRealtimeEvent(event);
                } catch { }
            };

            // Create offer
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            // Get ephemeral key from our API
            const tokenResponse = await fetch("/api/realtime-session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    model: config.model,
                    voice: config.voiceId,
                    system_instructions: config.systemInstructions,
                }),
            });

            if (!tokenResponse.ok) {
                const errData = await tokenResponse.json();
                throw new Error(errData.error || "Failed to get session token");
            }

            const tokenData = await tokenResponse.json();
            const ephemeralKey = tokenData.data?.client_secret?.value || tokenData.data?.client_secret;

            if (!ephemeralKey) {
                throw new Error("No ephemeral key received");
            }

            // Connect to OpenAI Realtime API directly with the ephemeral key
            const baseUrl = "https://api.openai.com/v1/realtime";
            const model = config.model || "gpt-4o-realtime-preview";

            const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${ephemeralKey}`,
                    "Content-Type": "application/sdp",
                },
                body: offer.sdp,
            });

            if (!sdpResponse.ok) {
                const errText = await sdpResponse.text();
                throw new Error(`OpenAI SDP error: ${sdpResponse.status} - ${errText}`);
            }

            const answerSdp = await sdpResponse.text();
            await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });

            // Wait for connection
            pc.onconnectionstatechange = () => {
                if (pc.connectionState === "connected") {
                    // Stop ringtone when connected
                    ringtoneRef.current?.stop();
                    ringtoneRef.current = null;

                    setStatus("connected");

                    // Start duration timer
                    const startTime = Date.now();
                    durationIntervalRef.current = setInterval(() => {
                        const duration = Math.floor((Date.now() - startTime) / 1000);
                        sessionDurationRef.current = duration;
                        setSessionDuration(duration);
                    }, 1000);
                } else if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
                    // Stop ringtone on failure
                    ringtoneRef.current?.stop();
                    ringtoneRef.current = null;

                    setError("Connection lost");
                    setStatus("error");
                }
            };

        } catch (err) {
            // Stop ringtone on error
            ringtoneRef.current?.stop();
            ringtoneRef.current = null;

            console.error("Session error:", err);
            setError(err instanceof Error ? err.message : "Failed to start session");
            setStatus("error");
        }
    };

    const endSession = async () => {
        const duration = sessionDurationRef.current;
        const messages = [...conversationRef.current];

        cleanup();
        setStatus("ended");

        // Save session to database
        if (config && messages.length > 0) {
            try {
                const response = await fetch("/api/save-session", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        scenarioId: config.scenarioId,
                        mode: config.mode,
                        duration,
                        messages,
                    }),
                });

                if (response.ok) {
                    const result = await response.json();
                    console.log(`✅ Session saved: ${result.sessionId} (${messages.length} messages, ${duration}s)`);
                }
            } catch (err) {
                console.error("Failed to save session:", err);
            }
        }
    };

    // Format duration as HH:MM:SS
    const formatDurationLong = (seconds: number): string => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    // Format duration as M:SS for ended view
    const formatDuration = (seconds: number): string => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    // Loading state
    if (status === "loading") {
        return (
            <div className="h-screen w-full bg-[#E8EEFF] flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                <p className="text-gray-600">Préparation de la session...</p>
            </div>
        );
    }

    // Error state
    if (status === "error") {
        return (
            <div className="h-screen w-full bg-[#E8EEFF] flex flex-col items-center justify-center gap-4 p-6">
                <AlertCircle className="w-16 h-16 text-red-500" />
                <p className="text-red-500 text-center">{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                    Réessayer
                </button>
            </div>
        );
    }

    // Config not loaded yet
    if (!config) {
        return (
            <div className="h-screen w-full bg-[#E8EEFF] flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
            </div>
        );
    }

    // Ended state
    if (status === "ended") {
        return (
            <div className="h-screen w-full bg-[#E8EEFF] flex flex-col items-center justify-center gap-6">
                <div className="w-24 h-24 rounded-full bg-green-500 flex items-center justify-center shadow-lg">
                    <span className="text-5xl text-white">✓</span>
                </div>
                <div className="text-center">
                    <p className="text-gray-900 text-2xl font-bold mb-2">Appel terminé</p>
                    <p className="text-gray-500 text-lg">Durée : {formatDuration(sessionDuration)}</p>
                </div>
            </div>
        );
    }

    // Extract first name and last name
    const nameParts = config.personaName.split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ').toUpperCase() || firstName.toUpperCase();
    const isCoachMode = config.mode === "coach";

    // For coach mode, format as "Coach Prénom Nom"
    const displayName = isCoachMode
        ? `Coach ${firstName} ${nameParts.slice(1).join(' ') || ''}`
        : `${firstName} ${lastName}`;

    return (
        <div className="relative h-screen w-full bg-white flex flex-col overflow-hidden font-sans">

            {/* Main Content Area */}
            <div className="flex-1 relative bg-gradient-to-br from-[#E8EEFF] to-[#F0F4FF] rounded-3xl m-4 overflow-hidden shadow-inner">

                {/* Top Left: Persona Badge - Show for coach mode (always) or connected state */}
                {(isCoachMode || status === "connecting" || status === "connected") && (
                    <div className="absolute top-3 left-3 z-20 flex items-center gap-2 bg-[#333C4E] text-white px-4 py-2.5 rounded-xl shadow-lg">
                        <Volume2 className="w-5 h-5 text-gray-300" />
                        <span className="font-semibold text-base">{displayName}</span>
                    </div>
                )}

                {/* Standard Mode: Ready State - Call Card Overlay */}
                {status === "ready" && !isCoachMode && (
                    <>
                        {/* Blur Overlay */}
                        <div className="absolute inset-0 bg-gray-500/30 backdrop-blur-sm z-20" />

                        {/* Call Card */}
                        <div className="absolute inset-0 flex items-center justify-center z-30">
                            <div className="bg-white rounded-3xl shadow-2xl p-8 flex flex-col items-center text-center max-w-[90%] w-full mx-3">

                                {/* Green Phone Icon */}
                                <div className="mb-5">
                                    <svg className="w-20 h-20 text-[#00D64F]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>

                                <h2 className="text-3xl text-gray-900 font-semibold mb-3">Appel sortant</h2>

                                <div className="text-gray-600 text-xl mb-1">{firstName}</div>
                                <div className="text-gray-900 text-2xl font-bold mb-6">{lastName}</div>

                                <button
                                    onClick={startSession}
                                    className="w-full bg-[#00D64F] hover:bg-[#00c046] text-white text-lg font-semibold py-4 px-8 rounded-xl flex items-center justify-center gap-3 transition-all hover:shadow-lg mb-4"
                                >
                                    <Phone className="w-6 h-6" />
                                    Démarrer la conversation
                                </button>

                                <p className="text-gray-400 text-base">
                                    Préparez-vous, la conversation démarrera immédiatement
                                </p>
                            </div>
                        </div>
                    </>
                )}

                {/* Coach Mode OR Connected State - Central Avatar */}
                {(isCoachMode || status === "connecting" || status === "connected") && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="relative">
                            {/* Sound Wave Rings - Only when AI is speaking */}
                            {isAiSpeaking && (
                                <>
                                    {/* Wave 1 - Innermost */}
                                    <div
                                        className="absolute rounded-full border-[3px] border-[#7C8FFF]"
                                        style={{
                                            inset: '-20px',
                                            animation: 'wave-expand 2s ease-out infinite',
                                        }}
                                    />
                                    {/* Wave 2 */}
                                    <div
                                        className="absolute rounded-full border-[3px] border-[#7C8FFF]"
                                        style={{
                                            inset: '-20px',
                                            animation: 'wave-expand 2s ease-out infinite 0.5s',
                                        }}
                                    />
                                    {/* Wave 3 */}
                                    <div
                                        className="absolute rounded-full border-[3px] border-[#7C8FFF]"
                                        style={{
                                            inset: '-20px',
                                            animation: 'wave-expand 2s ease-out infinite 1s',
                                        }}
                                    />
                                    {/* Wave 4 - Outermost */}
                                    <div
                                        className="absolute rounded-full border-[3px] border-[#7C8FFF]"
                                        style={{
                                            inset: '-20px',
                                            animation: 'wave-expand 2s ease-out infinite 1.5s',
                                        }}
                                    />
                                </>
                            )}

                            {/* Static Ring when not speaking */}
                            {!isAiSpeaking && (
                                <div className="absolute rounded-full border-4 border-[#C8D4FF]/50" style={{ inset: '-10px' }} />
                            )}

                            {/* Avatar Container */}
                            <div
                                className="w-56 h-56 md:w-64 md:h-64 rounded-full border-[5px] overflow-hidden shadow-xl transition-all duration-300"
                                style={{
                                    borderColor: isAiSpeaking ? '#7C8FFF' : 'white',
                                    boxShadow: isAiSpeaking
                                        ? '0 0 50px rgba(124, 143, 255, 0.5), 0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                                        : '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                                }}
                            >
                                <img
                                    src="https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=300&h=300"
                                    alt={config.personaName}
                                    className="w-full h-full object-cover"
                                />
                            </div>

                            {/* Connecting Overlay */}
                            {status === "connecting" && (
                                <div className="absolute inset-0 rounded-full bg-black/30 flex items-center justify-center">
                                    <Loader2 className="w-10 h-10 text-white animate-spin" />
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Bottom Right: User Video Preview */}
                <div className="absolute bottom-3 right-3 z-20 w-32 h-20 bg-[#1E293B] rounded-xl overflow-hidden shadow-xl flex items-center justify-center">
                    {/* User Badge */}
                    <div className="absolute top-1.5 left-1.5 flex items-center gap-1 bg-black/40 px-1.5 py-0.5 rounded">
                        <Camera className="w-2.5 h-2.5 text-white/70" />
                        <span className="text-white/90 text-[10px] font-medium">Vous</span>
                    </div>

                    {/* Camera Off Icon */}
                    <VideoOff className="w-6 h-6 text-gray-500" />

                    {/* Mute Indicator */}
                    <div className="absolute bottom-1.5 right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                        <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                            <line x1="12" y1="19" x2="12" y2="23" />
                            <line x1="8" y1="23" x2="16" y2="23" />
                            <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Bottom Controls Bar */}
            <div className="flex items-center justify-center gap-4 py-3 px-4">
                {/* Coach Mode: Simple Start/End Button */}
                {isCoachMode ? (
                    <>
                        {status === "ready" && (
                            <button
                                onClick={startSession}
                                className="bg-[#00D64F] hover:bg-[#00c046] text-white text-lg font-semibold py-4 px-10 rounded-xl flex items-center justify-center gap-3 transition-all hover:shadow-lg shadow-lg"
                            >
                                <Phone className="w-6 h-6" />
                                Démarrer la conversation
                            </button>
                        )}
                        {(status === "connecting" || status === "connected") && (
                            <button
                                onClick={endSession}
                                disabled={status !== "connected"}
                                className="bg-red-500 hover:bg-red-600 disabled:bg-red-300 disabled:cursor-not-allowed text-white text-lg font-semibold py-4 px-10 rounded-xl flex items-center justify-center gap-3 transition-all shadow-lg"
                            >
                                <PhoneOff className="w-6 h-6" />
                                Terminer la conversation
                            </button>
                        )}
                    </>
                ) : (
                    /* Standard Mode: Full Controls */
                    <>
                        {/* Timer */}
                        <div className="flex items-center gap-2 bg-gray-100 px-5 py-2.5 rounded-full">
                            <svg className="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                            </svg>
                            <span className="text-gray-700 font-mono text-base tabular-nums font-medium">
                                {formatDurationLong(sessionDuration)}
                            </span>
                        </div>

                        {/* Microphone Button - Active (green) */}
                        <button className="w-14 h-14 bg-[#00D64F] hover:bg-[#00c046] rounded-full flex items-center justify-center text-white transition-all shadow-lg">
                            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                                <path d="M19 10v2a7 7 0 0 1-14 0v-2" fill="none" stroke="currentColor" strokeWidth="2" />
                                <line x1="12" y1="19" x2="12" y2="23" stroke="currentColor" strokeWidth="2" />
                                <line x1="8" y1="23" x2="16" y2="23" stroke="currentColor" strokeWidth="2" />
                            </svg>
                        </button>

                        {/* Video Button - Disabled */}
                        <button className="w-14 h-14 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-gray-500 transition-all">
                            <VideoOff className="w-6 h-6" />
                        </button>

                        {/* Pause Button */}
                        <button className="w-14 h-14 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-gray-500 transition-all">
                            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                                <rect x="6" y="4" width="4" height="16" rx="1" />
                                <rect x="14" y="4" width="4" height="16" rx="1" />
                            </svg>
                        </button>

                        {/* Hangup Button */}
                        <button
                            onClick={endSession}
                            disabled={status !== "connected"}
                            className="w-14 h-14 bg-red-500 hover:bg-red-600 disabled:bg-red-300 disabled:cursor-not-allowed rounded-full flex items-center justify-center text-white transition-all shadow-lg"
                        >
                            <PhoneOff className="w-6 h-6" />
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
