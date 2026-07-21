"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { useState, type FormEvent } from "react";
import { ContextualBackLink } from "@/features/app-shell/components";
import { ContentEditorSubmitActions, DiscProfileSelector } from "@/features/content/components";
import {
    AlertMessage,
    SessionBackgroundUploadField,
    SingleSelectField,
    VoiceSelectField,
} from "@/lib/ui/molecules";
import { Box, CardSurface, FieldLabel, InlineIcon, Text, TextArea, TextInput } from "@/lib/ui/atoms";
import {
    createFormSubmitApiError,
    notifyFormSubmitError,
    notifyFormSubmitSuccess,
} from "@/lib/ui/feedback/form-submit-feedback";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";
import {
    EMPTY_COACH_EDITOR_VALUES,
    type CoachEditorValues,
    type CoachListItem,
} from "@/features/coaches/domain/coach-list";
import { COACH_DISC_PROFILE_OPTIONS, COACHING_STYLE_OPTIONS } from "@/features/coaches/domain/coach-profile";
import { CONTENT_DOMAINS, CONTENT_STATUS } from "@/features/content/domain";
import { CoachAvatarField } from "./CoachAvatarField";

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

async function saveCoach(
    coachId: string | undefined,
    values: CoachEditorValues,
    avatarFile: File | null,
    backgroundFile: File | null,
) {
    const hasFile = Boolean(avatarFile || backgroundFile);
    const body = hasFile ? new FormData() : JSON.stringify(values);
    const headers = hasFile ? undefined : { "Content-Type": "application/json" };

    if (body instanceof FormData) {
        body.append("payload", JSON.stringify(values));
        if (avatarFile) body.append("avatarFile", avatarFile);
        if (backgroundFile) body.append("backgroundFile", backgroundFile);
    }

    const response = await fetch(coachId ? `/api/coaches/${coachId}` : "/api/coaches", {
        body,
        headers,
        method: coachId ? "PATCH" : "POST",
    });
    const payload = (await response.json().catch(() => null)) as ApiErrorPayload | null;

    if (!response.ok) {
        throw createFormSubmitApiError(
            payload,
            response.status,
            "Impossible d'enregistrer le coach IA.",
        );
    }

    if (!payload?.coach) {
        throw new Error("Le coach a été enregistré mais la réponse est incomplète.");
    }

    return payload.coach;
}

function FormSection({ children, title }: { children: React.ReactNode; title: string }) {
    return (
        <Box className="border-t border-[#E5E7EB] pt-7 first:border-t-0 first:pt-0">
            <Text as="h2" className="text-[15px] font-extrabold text-[#111827]">
                {title}
            </Text>
            <Box className="mt-4">{children}</Box>
        </Box>
    );
}

function Field({
    children,
    htmlFor,
    label,
    required = false,
}: {
    children: React.ReactNode;
    htmlFor: string;
    label: string;
    required?: boolean;
}) {
    return (
        <Box>
            <FieldLabel required={required} htmlFor={htmlFor} className="mb-1.5 text-[12px] font-semibold text-[#374151]">
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
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [backgroundFile, setBackgroundFile] = useState<File | null>(null);
    const [formError, setFormError] = useState<string | null>(null);
    const isEditing = Boolean(coachId);
    const mutation = useMutation({
        mutationFn: (values: CoachEditorValues) => saveCoach(
            coachId,
            values,
            avatarFile,
            backgroundFile,
        ),
        onError: (error) => {
            setFormError(notifyFormSubmitError(error, "Impossible d'enregistrer le coach IA."));
        },
        onSuccess: async (savedCoach) => {
            queryClient.setQueryData<CoachListItem[]>(["coaches"], (current) => {
                if (!current) {
                    return [savedCoach];
                }

                return [savedCoach, ...current.filter((coach) => coach.id !== savedCoach.id)];
            });
            await queryClient.invalidateQueries({ queryKey: ["coaches"] });
            notifyFormSubmitSuccess();

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
        const action = ((event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null)?.value;
        mutation.mutate({
            ...form,
            status: action === "save-draft"
                ? CONTENT_STATUS.draft
                : action === "publish"
                  ? CONTENT_STATUS.published
                  : form.status,
        });
    }

    return (
        <Box as={embedded ? "div" : "main"} className={embedded ? "" : "px-5 pb-16 md:px-9 lg:px-12"}>
            <form onSubmit={handleSubmit} className={embedded ? "space-y-4" : "mx-auto max-w-[960px] space-y-4"}>
                {!embedded && <Box className="flex items-center gap-3">
                    <ContextualBackLink
                        fallbackHref="/coaches"
                        aria-label="Retour"
                        className="flex h-8 w-8 items-center justify-center rounded-full text-[#111827] transition hover:bg-white"
                    >
                        <InlineIcon icon={ArrowLeft} className="h-4 w-4" />
                    </ContextualBackLink>
                    <Text as="h1" className="text-[22px] font-extrabold text-[#111827]">
                        {isEditing ? "Modifier le coach IA" : "Créer un coach IA"}
                    </Text>
                </Box>}

                <CardSurface className={cn(uiTokens.surface.formCard, "space-y-7")}>
                    <FormSection title="Avatar du coach">
                        <CoachAvatarField
                            avatarFile={avatarFile}
                            avatarUrl={form.avatarSrc}
                            coachName={form.name}
                            disabled={mutation.isPending}
                            onAvatarFileChange={setAvatarFile}
                            onAvatarUrlChange={(value) => patch("avatarSrc", value)}
                            onError={setFormError}
                        />
                    </FormSection>

                    <FormSection title="Identité du coach">
                        <Field required label="Nom du coach" htmlFor="coach-name">
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
                    </FormSection>

                    <FormSection title="Décor des sessions de coaching">
                        <SessionBackgroundUploadField
                            disabled={mutation.isPending}
                            file={backgroundFile}
                            inputId="coach-session-background"
                            storedPath={form.backgroundImagePath}
                            onError={setFormError}
                            onFileSelected={(file) => {
                                setBackgroundFile(file);
                                patch("backgroundImagePath", "");
                            }}
                            onClear={() => {
                                setBackgroundFile(null);
                                patch("backgroundImagePath", "");
                            }}
                        />
                    </FormSection>

                    <FormSection title="Domaine d'expertise">
                        <Box>
                            <FieldLabel className="mb-1.5 text-[12px] font-semibold text-[#374151]">
                                Domaine
                            </FieldLabel>
                            <SingleSelectField
                                options={[...CONTENT_DOMAINS]}
                                value={form.expertiseDomain || null}
                                placeholder="Sélectionner un domaine d'expertise"
                                onChange={(value) => patch("expertiseDomain", value as CoachEditorValues["expertiseDomain"])}
                            />
                        </Box>
                    </FormSection>

                    <FormSection title="Style de coaching">
                        <Box className="grid gap-3 md:grid-cols-3">
                            {COACHING_STYLE_OPTIONS.map((option) => {
                                const isSelected = form.coachingStyle === option.value;

                                return (
                                    <button
                                        key={option.value}
                                        type="button"
                                        aria-pressed={isSelected}
                                        onClick={() => patch("coachingStyle", option.value)}
                                        className={cn(
                                            "min-h-[84px] rounded-[12px] border px-4 py-4 text-center transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5140F0]/40",
                                            isSelected
                                                ? uiTokens.tone.primary.soft
                                                : "border-[#E5E7EB] bg-white text-[#111827] hover:border-[#D5D7DE]",
                                        )}
                                    >
                                        <Text as="span" className="block text-[14px] font-extrabold">
                                            {option.label}
                                        </Text>
                                        <Text as="span" className="mt-2 block text-[12px] font-bold opacity-70">
                                            {option.description}
                                        </Text>
                                    </button>
                                );
                            })}
                        </Box>
                    </FormSection>

                    <FormSection title="Profil DISC">
                        <DiscProfileSelector
                            className="lg:grid-cols-4"
                            disabled={mutation.isPending}
                            options={COACH_DISC_PROFILE_OPTIONS}
                            value={form.discProfile}
                            onChange={(value) => patch("discProfile", value)}
                        />
                    </FormSection>

                    <FormSection title="Diplôme et certifications obtenues">
                        <Box className="grid gap-4 sm:grid-cols-2">
                            <Field label="Diplôme" htmlFor="coach-diploma">
                                <TextInput
                                    density="sm"
                                    id="coach-diploma"
                                    placeholder="Ex : Master coaching professionnel"
                                    hasLeadingIcon={false}
                                    value={form.diploma}
                                    onChange={(event) => patch("diploma", event.target.value)}
                                />
                            </Field>
                            <Field label="Certifications obtenues" htmlFor="coach-certifications">
                                <TextArea
                                    id="coach-certifications"
                                    rows={4}
                                    placeholder="Ex : RNCP, ICF, DISC, Process Com..."
                                    value={form.certifications}
                                    onChange={(event) => patch("certifications", event.target.value)}
                                    className="min-h-[96px]"
                                />
                            </Field>
                        </Box>
                    </FormSection>

                    <FormSection title="Voix">
                        <Field label="Voix du coach" htmlFor="coach-voice">
                            <VoiceSelectField
                                id="coach-voice"
                                value={form.voiceId}
                                disabled={mutation.isPending}
                                onChange={(voiceId) => patch("voiceId", voiceId)}
                            />
                        </Field>
                    </FormSection>

                    <FormSection title="Instructions du coach">
                        <Field required label="Comportement et méthode de coaching" htmlFor="coach-instructions">
                            <TextArea
                                id="coach-instructions"
                                rows={9}
                                required
                                placeholder="Décrivez le rôle du coach, sa méthode, son ton et les règles qu'il doit suivre."
                                value={form.systemInstructions}
                                onChange={(event) => patch("systemInstructions", event.target.value)}
                            />
                        </Field>
                    </FormSection>
                </CardSurface>

                <Box className="mx-auto w-full max-w-[420px] space-y-4 pt-2">
                    {formError && <AlertMessage message={formError} />}
                    <ContentEditorSubmitActions
                        isDraft={!embedded && (!isEditing || form.status === CONTENT_STATUS.draft)}
                        isPending={mutation.isPending}
                        publishLabel="Publier le coach IA"
                        submitLabel={isEditing ? "Enregistrer les modifications" : "Créer mon coach IA"}
                    />
                </Box>
            </form>
        </Box>
    );
}
