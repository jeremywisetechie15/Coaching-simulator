"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check } from "lucide-react";
import { useState, type FormEvent } from "react";
import { AlertMessage } from "@/lib/ui/molecules";
import { Box, CardSurface, FieldLabel, InlineIcon, SelectInput, Text, TextArea, TextInput } from "@/lib/ui/atoms";
import { cn } from "@/lib/ui/utils/cn";
import { OPENAI_REALTIME_VOICES } from "@/lib/openai/realtime-voices";
import {
    EMPTY_COACH_EDITOR_VALUES,
    getCoachInitials,
    type CoachEditorValues,
    type CoachListItem,
} from "@/features/coaches/domain/coach-list";
import { coachAvatarOptions } from "@/features/coaches/data/coachOptions";

interface CreateCoachPageContentProps {
    coachId?: string;
    embedded?: boolean;
    initialValues?: CoachEditorValues;
    onSaved?: (coach: CoachListItem) => void;
}

interface ApiErrorPayload {
    coach?: CoachListItem;
    error?: string;
    issues?: Array<{ message: string }>;
}

async function saveCoach(coachId: string | undefined, values: CoachEditorValues) {
    const response = await fetch(coachId ? `/api/coaches/${coachId}` : "/api/coaches", {
        body: JSON.stringify(values),
        headers: { "Content-Type": "application/json" },
        method: coachId ? "PATCH" : "POST",
    });
    const payload = (await response.json().catch(() => null)) as ApiErrorPayload | null;

    if (!response.ok) {
        const validationMessage = payload?.issues?.map((issue) => issue.message).join(" ");
        throw new Error(validationMessage || payload?.error || "Impossible d'enregistrer le coach IA.");
    }

    if (!payload?.coach) {
        throw new Error("Le coach a été enregistré mais la réponse est incomplète.");
    }

    return payload.coach;
}

function SectionCard({ children, title }: { children: React.ReactNode; title: string }) {
    return (
        <CardSurface className="rounded-[16px] border border-[#E9E7FB] p-5 shadow-[0_1px_2px_rgba(17,24,39,0.04)]">
            <Text as="h2" className="text-[15px] font-extrabold text-[#111827]">
                {title}
            </Text>
            <Box className="mt-4">{children}</Box>
        </CardSurface>
    );
}

function Field({
    children,
    htmlFor,
    label,
}: {
    children: React.ReactNode;
    htmlFor: string;
    label: string;
}) {
    return (
        <Box>
            <FieldLabel htmlFor={htmlFor} className="mb-1.5 text-[12px] font-semibold text-[#374151]">
                {label}
            </FieldLabel>
            {children}
        </Box>
    );
}

export function CreateCoachPageContent({
    coachId,
    embedded = false,
    initialValues = EMPTY_COACH_EDITOR_VALUES,
    onSaved,
}: CreateCoachPageContentProps) {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [form, setForm] = useState<CoachEditorValues>(initialValues);
    const [formError, setFormError] = useState<string | null>(null);
    const isEditing = Boolean(coachId);
    const mutation = useMutation({
        mutationFn: (values: CoachEditorValues) => saveCoach(coachId, values),
        onError: (error) => {
            setFormError(error instanceof Error ? error.message : "Impossible d'enregistrer le coach IA.");
        },
        onSuccess: async (savedCoach) => {
            queryClient.setQueryData<CoachListItem[]>(["coaches"], (current) => {
                if (!current) {
                    return [savedCoach];
                }

                return [savedCoach, ...current.filter((coach) => coach.id !== savedCoach.id)];
            });
            await queryClient.invalidateQueries({ queryKey: ["coaches"] });

            if (onSaved) {
                onSaved(savedCoach);
                return;
            }

            router.push("/coaches");
            router.refresh();
        },
    });

    function patch<K extends keyof CoachEditorValues>(key: K, value: CoachEditorValues[K]) {
        setForm((previous) => ({ ...previous, [key]: value }));
    }

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setFormError(null);
        mutation.mutate(form);
    }

    return (
        <Box as={embedded ? "div" : "main"} className={embedded ? "" : "px-5 pb-16 md:px-9 lg:px-12"}>
            <form onSubmit={handleSubmit} className={embedded ? "space-y-4" : "mx-auto max-w-[960px] space-y-4"}>
                {!embedded && <Box className="flex items-center gap-3">
                    <Link
                        href="/coaches"
                        aria-label="Retour"
                        className="flex h-8 w-8 items-center justify-center rounded-full text-[#111827] transition hover:bg-white"
                    >
                        <InlineIcon icon={ArrowLeft} className="h-4 w-4" />
                    </Link>
                    <Text as="h1" className="text-[22px] font-extrabold text-[#111827]">
                        {isEditing ? "Modifier le coach IA" : "Créer un coach IA"}
                    </Text>
                </Box>}

                <SectionCard title="Identité du coach">
                    <Box className="flex flex-col gap-5 md:flex-row md:items-start">
                        <Box className="flex h-[100px] w-[100px] shrink-0 items-center justify-center overflow-hidden rounded-full border-[3px] border-[#E7EAFF] bg-[#F1F2F6]">
                            {form.avatarSrc ? (
                                <Box
                                    aria-label={form.name || "Avatar du coach"}
                                    role="img"
                                    className="h-full w-full bg-cover bg-center"
                                    style={{ backgroundImage: `url(${form.avatarSrc})` }}
                                />
                            ) : (
                                <Text className="text-[22px] font-extrabold text-[#5140F0]">
                                    {getCoachInitials(form.name)}
                                </Text>
                            )}
                        </Box>
                        <Box className="grid w-full gap-4 sm:grid-cols-2">
                            <Field label="Nom du coach" htmlFor="coach-name">
                                <TextInput
                                    density="sm"
                                    id="coach-name"
                                    placeholder="Ex : Pierre Laurent"
                                    hasLeadingIcon={false}
                                    required
                                    value={form.name}
                                    onChange={(event) => patch("name", event.target.value)}
                                />
                            </Field>
                            <Field label="URL de l'avatar" htmlFor="coach-avatar">
                                <TextInput
                                    density="sm"
                                    id="coach-avatar"
                                    placeholder="https://... ou /coaches/avatar.png"
                                    hasLeadingIcon={false}
                                    value={form.avatarSrc}
                                    onChange={(event) => patch("avatarSrc", event.target.value)}
                                />
                            </Field>
                        </Box>
                    </Box>
                </SectionCard>

                <SectionCard title="Avatars proposés">
                    <Box className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                        {coachAvatarOptions.map((avatar) => (
                            <button
                                key={avatar.id}
                                aria-label={avatar.name}
                                aria-pressed={form.avatarSrc === avatar.src}
                                onClick={() => patch("avatarSrc", avatar.src)}
                                type="button"
                                className={cn(
                                    "relative mx-auto aspect-square w-full max-w-[150px] overflow-hidden rounded-[16px] border-2 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5140F0]/40",
                                    form.avatarSrc === avatar.src
                                        ? "border-[#5140F0] shadow-[0_8px_18px_rgba(81,64,240,0.20)]"
                                        : "border-transparent hover:border-[#E5E7EB]",
                                )}
                            >
                                <Box
                                    aria-label={avatar.name}
                                    role="img"
                                    className="absolute inset-0 bg-cover bg-center"
                                    style={{ backgroundImage: `url(${avatar.src})` }}
                                />
                            </button>
                        ))}
                    </Box>
                </SectionCard>

                <SectionCard title="Voix">
                    <Field label="Voix du coach" htmlFor="coach-voice">
                        <SelectInput
                            density="sm"
                            id="coach-voice"
                            value={form.voiceId}
                            onChange={(event) => patch("voiceId", event.target.value as CoachEditorValues["voiceId"])}
                        >
                            {OPENAI_REALTIME_VOICES.map((voice) => (
                                <option key={voice.id} value={voice.id}>
                                    {voice.name} ({voice.id}) - {voice.characteristic}
                                </option>
                            ))}
                        </SelectInput>
                    </Field>
                </SectionCard>

                <SectionCard title="Instructions du coach">
                    <Field label="Comportement et méthode de coaching" htmlFor="coach-instructions">
                        <TextArea
                            id="coach-instructions"
                            rows={9}
                            required
                            placeholder="Décrivez le rôle du coach, sa méthode, son ton et les règles qu'il doit suivre."
                            value={form.systemInstructions}
                            onChange={(event) => patch("systemInstructions", event.target.value)}
                        />
                    </Field>
                </SectionCard>

                <Box className="mx-auto w-full max-w-[420px] space-y-4 pt-2">
                    {formError && <AlertMessage message={formError} />}
                    <button
                        type="submit"
                        disabled={mutation.isPending}
                        className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#5140F0] px-5 text-[13px] font-bold text-white shadow-[0_10px_20px_rgba(81,64,240,0.20)] transition hover:bg-[#4635E7] disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        <InlineIcon icon={Check} className="h-4 w-4" />
                        {mutation.isPending
                            ? "Enregistrement..."
                            : isEditing
                              ? "Enregistrer les modifications"
                              : "Créer mon coach IA"}
                    </button>
                </Box>
            </form>
        </Box>
    );
}
