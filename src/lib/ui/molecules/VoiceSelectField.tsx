"use client";

import { Pause, Play } from "lucide-react";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import {
    getOpenAIRealtimeVoice,
    OPENAI_REALTIME_VOICES,
    type VoiceId,
} from "@/lib/openai/realtime-voices";
import { Button, InlineIcon, SelectInput, Text } from "@/lib/ui/atoms";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";

interface VoiceSelectFieldProps {
    disabled?: boolean;
    id?: string;
    onChange: (voiceId: VoiceId) => void;
    value: VoiceId;
}

export function VoiceSelectField({ disabled, id, onChange, value }: VoiceSelectFieldProps) {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const selectedVoice = getOpenAIRealtimeVoice(value);

    function stopPreview() {
        const audio = audioRef.current;
        if (audio) {
            audio.pause();
            audio.currentTime = 0;
            audioRef.current = null;
        }
        setIsPlaying(false);
    }

    useEffect(
        () => () => {
            const audio = audioRef.current;
            if (audio) {
                audio.pause();
                audio.currentTime = 0;
                audioRef.current = null;
            }
        },
        [],
    );

    function handleChange(event: ChangeEvent<HTMLSelectElement>) {
        stopPreview();
        onChange(event.target.value as VoiceId);
    }

    async function togglePreview() {
        if (!selectedVoice || disabled) return;

        if (isPlaying) {
            stopPreview();
            return;
        }

        stopPreview();
        const audio = new Audio(selectedVoice.previewSrc);
        audio.preload = "none";
        audioRef.current = audio;
        audio.onended = () => {
            if (audioRef.current === audio) {
                audioRef.current = null;
                setIsPlaying(false);
            }
        };
        audio.onerror = () => {
            if (audioRef.current === audio) {
                audioRef.current = null;
                setIsPlaying(false);
            }
        };

        try {
            await audio.play();
            if (audioRef.current === audio) {
                setIsPlaying(true);
            }
        } catch {
            if (audioRef.current === audio) {
                audioRef.current = null;
                setIsPlaying(false);
            }
        }
    }

    const PreviewIcon = isPlaying ? Pause : Play;
    const previewLabel = isPlaying ? "Pause" : "Écouter";
    const voiceName = selectedVoice?.name ?? value;

    return (
        <div className={uiTokens.voice.field}>
            <SelectInput
                density="sm"
                disabled={disabled}
                id={id}
                value={value}
                onChange={handleChange}
                className={uiTokens.voice.select}
            >
                {OPENAI_REALTIME_VOICES.map((voice) => (
                    <option key={voice.id} value={voice.id}>
                        {voice.name}
                    </option>
                ))}
            </SelectInput>
            <Button
                aria-label={`${previewLabel} l'extrait de la voix ${voiceName}`}
                aria-pressed={isPlaying}
                disabled={disabled || !selectedVoice}
                onClick={() => void togglePreview()}
                className={cn(
                    uiTokens.voice.previewButton,
                    isPlaying ? uiTokens.voice.previewButtonActive : uiTokens.voice.previewButtonIdle,
                )}
            >
                <InlineIcon icon={PreviewIcon} className={uiTokens.voice.previewIcon} />
                <Text as="span">{previewLabel}</Text>
            </Button>
        </div>
    );
}
