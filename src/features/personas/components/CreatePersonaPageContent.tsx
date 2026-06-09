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
    EMPTY_PERSONA_EDITOR_VALUES,
    getPersonaAvatarPublicUrl,
    getPersonaInitials,
    type PersonaEditorValues,
    type PersonaListItem,
} from "@/features/personas/domain/persona-list";
import { personaAvatarOptions } from "@/features/personas/data/persona-creation";

interface CreatePersonaPageContentProps {
    embedded?: boolean;
    initialValues?: PersonaEditorValues;
    onSaved?: (persona: PersonaListItem) => void;
    personaId?: string;
}

interface ApiErrorPayload {
    error?: string;
    issues?: Array<{ message: string }>;
    persona?: PersonaListItem;
}

async function savePersona(personaId: string | undefined, values: PersonaEditorValues) {
    const response = await fetch(personaId ? `/api/personas/${personaId}` : "/api/personas", {
        body: JSON.stringify(values),
        headers: { "Content-Type": "application/json" },
        method: personaId ? "PATCH" : "POST",
    });
    const payload = (await response.json().catch(() => null)) as ApiErrorPayload | null;

    if (!response.ok) {
        const validationMessage = payload?.issues?.map((issue) => issue.message).join(" ");
        throw new Error(validationMessage || payload?.error || "Impossible d'enregistrer le persona.");
    }

    if (!payload?.persona) {
        throw new Error("Le persona a été enregistré mais la réponse est incomplète.");
    }

    return payload.persona;
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

export function CreatePersonaPageContent({
    embedded = false,
    initialValues = EMPTY_PERSONA_EDITOR_VALUES,
    onSaved,
    personaId,
}: CreatePersonaPageContentProps) {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [form, setForm] = useState<PersonaEditorValues>(initialValues);
    const [formError, setFormError] = useState<string | null>(null);
    const isEditing = Boolean(personaId);
    const avatarPreviewUrl = getPersonaAvatarPublicUrl(form.avatarUrl);
    const mutation = useMutation({
        mutationFn: (values: PersonaEditorValues) => savePersona(personaId, values),
        onError: (error) => {
            setFormError(error instanceof Error ? error.message : "Impossible d'enregistrer le persona.");
        },
        onSuccess: async (savedPersona) => {
            queryClient.setQueryData<PersonaListItem[]>(["personas"], (current) => {
                if (!current) {
                    return [savedPersona];
                }

                return [savedPersona, ...current.filter((persona) => persona.id !== savedPersona.id)];
            });
            await queryClient.invalidateQueries({ queryKey: ["personas"] });

            if (onSaved) {
                onSaved(savedPersona);
                return;
            }

            router.push("/personas");
            router.refresh();
        },
    });

    function patch<K extends keyof PersonaEditorValues>(key: K, value: PersonaEditorValues[K]) {
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
                        href="/personas"
                        aria-label="Retour"
                        className="flex h-8 w-8 items-center justify-center rounded-full text-[#111827] transition hover:bg-white"
                    >
                        <InlineIcon icon={ArrowLeft} className="h-4 w-4" />
                    </Link>
                    <Text as="h1" className="text-[22px] font-extrabold text-[#111827]">
                        {isEditing ? "Modifier le persona IA" : "Créer un persona IA"}
                    </Text>
                </Box>}

                <SectionCard title="Identité du persona">
                    <Box className="flex flex-col gap-5 md:flex-row md:items-start">
                        <Box className="flex h-[88px] w-[88px] shrink-0 items-center justify-center overflow-hidden rounded-full border-[3px] border-[#E7DCFB] bg-[#F1F2F6] shadow-[0_8px_18px_rgba(139,47,214,0.18)]">
                            {avatarPreviewUrl ? (
                                <Box
                                    role="img"
                                    aria-label={form.name || "Avatar du persona"}
                                    className="h-full w-full bg-cover bg-center"
                                    style={{ backgroundImage: `url(${avatarPreviewUrl})` }}
                                />
                            ) : (
                                <Text className="text-[20px] font-extrabold text-[#5140F0]">
                                    {getPersonaInitials(form.name)}
                                </Text>
                            )}
                        </Box>
                        <Box className="grid w-full gap-4 sm:grid-cols-2">
                            <Field label="Nom du persona" htmlFor="persona-name">
                                <TextInput
                                    density="sm"
                                    id="persona-name"
                                    placeholder="Ex : Sophie Martin"
                                    hasLeadingIcon={false}
                                    required
                                    value={form.name}
                                    onChange={(event) => patch("name", event.target.value)}
                                />
                            </Field>
                            <Field label="Fonction" htmlFor="persona-role">
                                <TextInput
                                    density="sm"
                                    id="persona-role"
                                    placeholder="Ex : Directrice commerciale"
                                    hasLeadingIcon={false}
                                    value={form.role}
                                    onChange={(event) => patch("role", event.target.value)}
                                />
                            </Field>
                            <Field label="Entreprise" htmlFor="persona-company">
                                <TextInput
                                    density="sm"
                                    id="persona-company"
                                    placeholder="Ex : Acme"
                                    hasLeadingIcon={false}
                                    value={form.company}
                                    onChange={(event) => patch("company", event.target.value)}
                                />
                            </Field>
                            <Field label="URL de l'avatar" htmlFor="persona-avatar">
                                <TextInput
                                    density="sm"
                                    id="persona-avatar"
                                    placeholder="https://..."
                                    hasLeadingIcon={false}
                                    value={form.avatarUrl}
                                    onChange={(event) => patch("avatarUrl", event.target.value)}
                                />
                            </Field>
                        </Box>
                    </Box>
                </SectionCard>

                <SectionCard title="Avatars proposés">
                    <Box className="grid grid-cols-3 gap-3 sm:grid-cols-6">
                        {personaAvatarOptions.map((avatar) => (
                            <button
                                key={avatar.id}
                                aria-label={avatar.alt}
                                aria-pressed={form.avatarUrl === avatar.src}
                                onClick={() => patch("avatarUrl", avatar.src)}
                                type="button"
                                className={cn(
                                    "relative aspect-square overflow-hidden rounded-xl border-2 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5140F0]/40",
                                    form.avatarUrl === avatar.src
                                        ? "border-[#5140F0] shadow-[0_8px_18px_rgba(81,64,240,0.20)]"
                                        : "border-transparent hover:border-[#E5E7EB]",
                                )}
                            >
                                <Box
                                    role="img"
                                    aria-label={avatar.alt}
                                    className="absolute inset-0 bg-cover bg-center"
                                    style={{ backgroundImage: `url(${avatar.src})` }}
                                />
                            </button>
                        ))}
                    </Box>
                </SectionCard>

                <SectionCard title="Voix">
                    <Field label="Voix du persona" htmlFor="persona-voice">
                        <SelectInput
                            density="sm"
                            id="persona-voice"
                            value={form.voiceId}
                            onChange={(event) => patch("voiceId", event.target.value as PersonaEditorValues["voiceId"])}
                        >
                            {OPENAI_REALTIME_VOICES.map((voice) => (
                                <option key={voice.id} value={voice.id}>
                                    {voice.name} ({voice.id}) - {voice.characteristic}
                                </option>
                            ))}
                        </SelectInput>
                    </Field>
                </SectionCard>

                <SectionCard title="Instructions du persona">
                    <Field label="Comportement et contexte de jeu de rôle" htmlFor="persona-instructions">
                        <TextArea
                            id="persona-instructions"
                            rows={8}
                            required
                            placeholder="Décrivez qui est le persona, son contexte, ses objectifs et la manière dont il doit répondre."
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
                              : "Créer mon persona IA"}
                    </button>
                </Box>
            </form>
        </Box>
    );
}
