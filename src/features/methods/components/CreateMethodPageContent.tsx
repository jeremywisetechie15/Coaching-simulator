"use client";

import Link from "next/link";
import { ArrowLeft, Check, ChevronDown, Plus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Box, Button, CardSurface, InlineIcon, Text } from "@/lib/ui/atoms";

const categoryOptions = ["Commercial", "Management", "Communication", "Ressources humaines"];
const tagOptions = ["Vente", "Prospection", "Négociation", "Découverte", "Closing"];
const objectiveOptions = [
    "Prise de rendez-vous prospect qualifié",
    "Conduite d'entretien commercial",
    "Entretien commercial B2B",
    "Entretien de remobilisation",
];
const documentTypeOptions = ["URL", "PDF", "Vidéo"];
const stepIconOptions = ["Téléphone", "Message", "Bouclier", "Coche"];

const labelClasses = "mb-2 block text-[14px] font-bold text-[#111827]";
const inputClasses =
    "h-12 w-full rounded-lg border border-[#E5E7EB] bg-[#F3F4F6] px-3.5 text-[14px] text-[#111827] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#5140F0] focus:bg-white focus:ring-4 focus:ring-[#5140F0]/10";
const textareaClasses =
    "w-full resize-none rounded-lg border border-[#E5E7EB] bg-[#F3F4F6] px-3.5 py-3 text-[14px] text-[#111827] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#5140F0] focus:bg-white focus:ring-4 focus:ring-[#5140F0]/10";

function useOutsideClose(onClose: () => void) {
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        function handleClick(event: MouseEvent) {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                onClose();
            }
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [onClose]);
    return ref;
}

function SingleSelect({
    options,
    value,
    placeholder,
    onChange,
}: {
    options: string[];
    value: string | null;
    placeholder: string;
    onChange: (value: string) => void;
}) {
    const [open, setOpen] = useState(false);
    const ref = useOutsideClose(() => setOpen(false));

    return (
        <div ref={ref} className="relative">
            <Button
                onClick={() => setOpen((current) => !current)}
                aria-expanded={open}
                className={`flex h-12 w-full items-center justify-between rounded-lg border border-[#E5E7EB] bg-[#F3F4F6] px-3.5 text-[14px] transition hover:border-[#D5D7DE] ${
                    value ? "font-medium text-[#111827]" : "text-[#9CA3AF]"
                }`}
            >
                <Text as="span">{value ?? placeholder}</Text>
                <InlineIcon
                    icon={ChevronDown}
                    className={`h-4 w-4 text-[#9CA3AF] transition-transform ${open ? "rotate-180" : ""}`}
                />
            </Button>
            {open && (
                <CardSurface className="absolute left-0 right-0 top-[56px] z-30 max-h-[240px] overflow-y-auto rounded-xl border border-[#E5E7EB] p-1.5 shadow-[0_18px_40px_rgba(17,24,39,0.16)]">
                    {options.map((option) => (
                        <Button
                            key={option}
                            onClick={() => {
                                onChange(option);
                                setOpen(false);
                            }}
                            className={`flex h-11 w-full items-center justify-between gap-2 rounded-lg px-3 text-left text-[14px] font-medium transition hover:bg-[#F6F7FB] ${
                                option === value ? "text-[#5140F0]" : "text-[#111827]"
                            }`}
                        >
                            {option}
                            {option === value && <InlineIcon icon={Check} className="h-4 w-4 text-[#5140F0]" />}
                        </Button>
                    ))}
                </CardSurface>
            )}
        </div>
    );
}

function ListField({
    label,
    placeholder,
    items,
    onAdd,
    onChange,
    onRemove,
}: {
    label: string;
    placeholder: string;
    items: string[];
    onAdd: () => void;
    onChange: (index: number, value: string) => void;
    onRemove: (index: number) => void;
}) {
    return (
        <Box>
            <Box className="flex items-center justify-between">
                <Text as="span" className="text-[13px] font-bold text-[#374151]">
                    {label}
                </Text>
                <Button
                    onClick={onAdd}
                    aria-label={`Ajouter — ${label}`}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#E5E7EB] bg-white text-[#374151] transition hover:border-[#D5D7DE] hover:text-[#5140F0]"
                >
                    <InlineIcon icon={Plus} className="h-4 w-4" />
                </Button>
            </Box>
            <Box className="mt-2 space-y-2">
                {items.map((item, index) => (
                    <Box key={index} className="flex items-center gap-2.5">
                        <Box className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#C9CED8]" />
                        <input
                            value={item}
                            onChange={(event) => onChange(index, event.target.value)}
                            placeholder={placeholder}
                            className="h-11 w-full rounded-lg border border-[#E5E7EB] bg-[#F3F4F6] px-3 text-[14px] text-[#111827] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#5140F0] focus:bg-white focus:ring-4 focus:ring-[#5140F0]/10"
                        />
                        {items.length > 1 && (
                            <Button
                                aria-label="Retirer"
                                onClick={() => onRemove(index)}
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#9CA3AF] transition hover:bg-[#F3F4F8] hover:text-[#111827]"
                            >
                                <InlineIcon icon={X} className="h-4 w-4" />
                            </Button>
                        )}
                    </Box>
                ))}
            </Box>
        </Box>
    );
}

interface MethodStepDraft {
    title: string;
    description: string;
    icon: string;
    objectifs: string[];
    bonnesPratiques: string[];
    erreurs: string[];
    posture: string[];
    verbatims: string[];
}

function emptyStep(): MethodStepDraft {
    return {
        title: "",
        description: "",
        icon: stepIconOptions[0],
        objectifs: [""],
        bonnesPratiques: [""],
        erreurs: [""],
        posture: [""],
        verbatims: [""],
    };
}

export function CreateMethodPageContent() {
    const [name, setName] = useState("");
    const [acronym, setAcronym] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState<string | null>(null);
    const [tag, setTag] = useState<string | null>(null);
    const [objective, setObjective] = useState<string | null>(null);
    const [detailedContent, setDetailedContent] = useState("");
    const [docName, setDocName] = useState("");
    const [docType, setDocType] = useState<string | null>("URL");
    const [docUrl, setDocUrl] = useState("");
    const [objectifs, setObjectifs] = useState<string[]>([""]);
    const [enjeux, setEnjeux] = useState<string[]>([""]);
    const [steps, setSteps] = useState<MethodStepDraft[]>([emptyStep()]);

    const canSubmit = name.trim().length > 0;

    function updateList(
        list: string[],
        setter: (next: string[]) => void,
        index: number,
        value: string,
    ) {
        setter(list.map((item, itemIndex) => (itemIndex === index ? value : item)));
    }

    function updateStep(stepIndex: number, patch: Partial<MethodStepDraft>) {
        setSteps((current) =>
            current.map((step, index) => (index === stepIndex ? { ...step, ...patch } : step)),
        );
    }

    function updateStepList(
        stepIndex: number,
        key: keyof Pick<
            MethodStepDraft,
            "objectifs" | "bonnesPratiques" | "erreurs" | "posture" | "verbatims"
        >,
        next: string[],
    ) {
        updateStep(stepIndex, { [key]: next });
    }

    return (
        <Box as="main" className="px-5 pb-16 md:px-9 lg:px-12">
            <Box className="mx-auto max-w-[1000px]">
                <Box className="mb-6 flex items-center justify-between gap-4">
                    <Box className="flex items-center gap-4">
                        <Link
                            href="/methods"
                            aria-label="Retour"
                            className="flex h-9 w-9 items-center justify-center rounded-full text-[#111827] transition hover:bg-white"
                        >
                            <InlineIcon icon={ArrowLeft} className="h-5 w-5" />
                        </Link>
                        <Text as="h1" className="text-[26px] font-extrabold leading-tight text-[#111827] md:text-[30px]">
                            Ajouter une méthode
                        </Text>
                    </Box>
                    <Box className="flex items-center gap-3">
                        <Link
                            href="/methods"
                            className="flex h-10 items-center justify-center rounded-xl border border-[#E5E7EB] bg-white px-5 text-[14px] font-semibold text-[#374151] transition hover:border-[#D5D7DE]"
                        >
                            Annuler
                        </Link>
                        <Button
                            disabled={!canSubmit}
                            className={`flex h-10 items-center justify-center rounded-xl px-5 text-[14px] font-bold text-white transition ${
                                canSubmit
                                    ? "bg-[#5140F0] hover:bg-[#4635E7]"
                                    : "cursor-not-allowed bg-[#B9B2F8]"
                            }`}
                        >
                            Enregistrer
                        </Button>
                    </Box>
                </Box>

                <CardSurface className="rounded-[24px] border border-[#E9E7FB] p-7 shadow-[0_1px_2px_rgba(17,24,39,0.04)] md:p-9">
                    <Text as="h2" className="text-[20px] font-extrabold text-[#111827]">
                        Informations générales
                    </Text>
                    <Box className="mt-5 space-y-5">
                        <Box>
                            <Text as="span" className={labelClasses}>
                                Nom de la méthode
                            </Text>
                            <input
                                value={name}
                                onChange={(event) => setName(event.target.value)}
                                placeholder="Ex: Méthode DAGO"
                                className={inputClasses}
                            />
                        </Box>
                        <Box>
                            <Text as="span" className={labelClasses}>
                                Nom court / Acronyme
                            </Text>
                            <input
                                value={acronym}
                                onChange={(event) => setAcronym(event.target.value)}
                                placeholder="Ex: DAGO, 4C, MEDDPICC"
                                className={inputClasses}
                            />
                        </Box>
                        <Box>
                            <Text as="span" className={labelClasses}>
                                Description
                            </Text>
                            <textarea
                                value={description}
                                onChange={(event) => setDescription(event.target.value)}
                                placeholder="Décrivez brièvement la méthode..."
                                rows={3}
                                className={`min-h-[88px] ${textareaClasses}`}
                            />
                        </Box>
                        <Box className="grid gap-5 md:grid-cols-2">
                            <Box>
                                <Text as="span" className={labelClasses}>
                                    Catégorie
                                </Text>
                                <SingleSelect
                                    options={categoryOptions}
                                    value={category}
                                    placeholder="Sélectionner une catégorie"
                                    onChange={setCategory}
                                />
                            </Box>
                            <Box>
                                <Text as="span" className={labelClasses}>
                                    Tag de catégorie
                                </Text>
                                <SingleSelect
                                    options={tagOptions}
                                    value={tag}
                                    placeholder="Sélectionner un tag"
                                    onChange={setTag}
                                />
                            </Box>
                        </Box>
                        <Box>
                            <Text as="span" className={labelClasses}>
                                Objectif métier
                            </Text>
                            <SingleSelect
                                options={objectiveOptions}
                                value={objective}
                                placeholder="Sélectionner un objectif métier"
                                onChange={setObjective}
                            />
                        </Box>
                        <Box>
                            <Text as="span" className={labelClasses}>
                                Contenu détaillé
                            </Text>
                            <textarea
                                value={detailedContent}
                                onChange={(event) => setDetailedContent(event.target.value)}
                                placeholder="Décrivez en détail la méthode, son contexte d'utilisation, ses principes..."
                                rows={5}
                                className={`min-h-[140px] ${textareaClasses}`}
                            />
                        </Box>
                        <Box>
                            <Box className="flex items-center justify-between">
                                <Text as="span" className="text-[14px] font-bold text-[#111827]">
                                    Ressources complémentaires
                                </Text>
                                <Button className="flex h-9 items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-white px-3 text-[13px] font-semibold text-[#374151] transition hover:border-[#D5D7DE]">
                                    <InlineIcon icon={Plus} className="h-3.5 w-3.5" />
                                    Ajouter un document
                                </Button>
                            </Box>
                            <CardSurface className="mt-3 space-y-4 rounded-[14px] border border-[#E5E7EB] bg-[#F7F8FB] p-4 shadow-none">
                                <Box>
                                    <Text as="span" className="mb-1.5 block text-[13px] font-bold text-[#374151]">
                                        Nom du document
                                    </Text>
                                    <input
                                        value={docName}
                                        onChange={(event) => setDocName(event.target.value)}
                                        placeholder="Ex: Guide de prospection DAGO"
                                        className="h-11 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 text-[14px] text-[#111827] outline-none transition focus:border-[#5140F0] focus:ring-4 focus:ring-[#5140F0]/10"
                                    />
                                </Box>
                                <Box>
                                    <Text as="span" className="mb-1.5 block text-[13px] font-bold text-[#374151]">
                                        Type de document
                                    </Text>
                                    <SingleSelect
                                        options={documentTypeOptions}
                                        value={docType}
                                        placeholder="Sélectionner un type"
                                        onChange={setDocType}
                                    />
                                </Box>
                                <Box>
                                    <Text as="span" className="mb-1.5 block text-[13px] font-bold text-[#374151]">
                                        URL du document
                                    </Text>
                                    <input
                                        value={docUrl}
                                        onChange={(event) => setDocUrl(event.target.value)}
                                        placeholder="https://..."
                                        className="h-11 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 text-[14px] text-[#111827] outline-none transition focus:border-[#5140F0] focus:ring-4 focus:ring-[#5140F0]/10"
                                    />
                                </Box>
                            </CardSurface>
                        </Box>
                    </Box>

                    <Box className="my-8 h-px bg-[#ECEEF3]" />

                    <Text as="h2" className="text-[20px] font-extrabold text-[#111827]">
                        Objectifs et Enjeux
                    </Text>
                    <Box className="mt-5 space-y-5">
                        <ListField
                            label="Objectifs"
                            placeholder="Ex: Obtenir un rendez-vous qualifié avec le décideur"
                            items={objectifs}
                            onAdd={() => setObjectifs((current) => [...current, ""])}
                            onChange={(index, value) => updateList(objectifs, setObjectifs, index, value)}
                            onRemove={(index) =>
                                setObjectifs((current) => current.filter((_, i) => i !== index))
                            }
                        />
                        <ListField
                            label="Enjeux"
                            placeholder="Ex: Éviter le refus catégorique du standard"
                            items={enjeux}
                            onAdd={() => setEnjeux((current) => [...current, ""])}
                            onChange={(index, value) => updateList(enjeux, setEnjeux, index, value)}
                            onRemove={(index) => setEnjeux((current) => current.filter((_, i) => i !== index))}
                        />
                    </Box>

                    <Box className="my-8 h-px bg-[#ECEEF3]" />

                    <Box className="flex items-center justify-between">
                        <Text as="h2" className="text-[20px] font-extrabold text-[#111827]">
                            Étapes de la méthode
                        </Text>
                        <Button
                            onClick={() => setSteps((current) => [...current, emptyStep()])}
                            className="flex h-9 items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-white px-3 text-[13px] font-semibold text-[#374151] transition hover:border-[#D5D7DE]"
                        >
                            <InlineIcon icon={Plus} className="h-3.5 w-3.5" />
                            Ajouter une étape
                        </Button>
                    </Box>

                    <Box className="mt-4 space-y-5">
                        {steps.map((step, stepIndex) => (
                            <CardSurface
                                key={stepIndex}
                                className="rounded-[16px] border border-[#E5E7EB] bg-[#FBFBFD] p-5 shadow-none"
                            >
                                <Box className="flex items-center justify-between">
                                    <Text as="h3" className="text-[15px] font-extrabold text-[#111827]">
                                        Étape {stepIndex + 1}
                                    </Text>
                                    {steps.length > 1 && (
                                        <Button
                                            aria-label={`Retirer l'étape ${stepIndex + 1}`}
                                            onClick={() =>
                                                setSteps((current) =>
                                                    current.filter((_, i) => i !== stepIndex),
                                                )
                                            }
                                            className="flex h-7 w-7 items-center justify-center rounded-lg text-[#9CA3AF] transition hover:bg-[#F3F4F8] hover:text-[#111827]"
                                        >
                                            <InlineIcon icon={X} className="h-4 w-4" />
                                        </Button>
                                    )}
                                </Box>

                                <Box className="mt-4 space-y-4">
                                    <Box>
                                        <Text as="span" className="mb-1.5 block text-[13px] font-bold text-[#374151]">
                                            Titre de l&apos;étape
                                        </Text>
                                        <input
                                            value={step.title}
                                            onChange={(event) =>
                                                updateStep(stepIndex, { title: event.target.value })
                                            }
                                            placeholder="Ex: Démarrer l'appel et passer le barrage du standard"
                                            className="h-11 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 text-[14px] text-[#111827] outline-none transition focus:border-[#5140F0] focus:ring-4 focus:ring-[#5140F0]/10"
                                        />
                                    </Box>
                                    <Box>
                                        <Text as="span" className="mb-1.5 block text-[13px] font-bold text-[#374151]">
                                            Description
                                        </Text>
                                        <textarea
                                            value={step.description}
                                            onChange={(event) =>
                                                updateStep(stepIndex, { description: event.target.value })
                                            }
                                            placeholder="Décrivez cette étape..."
                                            rows={2}
                                            className="min-h-[72px] w-full resize-none rounded-lg border border-[#E5E7EB] bg-white px-3 py-2.5 text-[14px] text-[#111827] outline-none transition focus:border-[#5140F0] focus:ring-4 focus:ring-[#5140F0]/10"
                                        />
                                    </Box>
                                    <Box>
                                        <Text as="span" className="mb-1.5 block text-[13px] font-bold text-[#374151]">
                                            Icône
                                        </Text>
                                        <SingleSelect
                                            options={stepIconOptions}
                                            value={step.icon}
                                            placeholder="Sélectionner une icône"
                                            onChange={(value) => updateStep(stepIndex, { icon: value })}
                                        />
                                    </Box>

                                    <ListField
                                        label="Objectifs de l'étape"
                                        placeholder="Objectif..."
                                        items={step.objectifs}
                                        onAdd={() =>
                                            updateStepList(stepIndex, "objectifs", [...step.objectifs, ""])
                                        }
                                        onChange={(index, value) =>
                                            updateStepList(
                                                stepIndex,
                                                "objectifs",
                                                step.objectifs.map((it, i) => (i === index ? value : it)),
                                            )
                                        }
                                        onRemove={(index) =>
                                            updateStepList(
                                                stepIndex,
                                                "objectifs",
                                                step.objectifs.filter((_, i) => i !== index),
                                            )
                                        }
                                    />
                                    <ListField
                                        label="Bonnes pratiques"
                                        placeholder="Bonne pratique..."
                                        items={step.bonnesPratiques}
                                        onAdd={() =>
                                            updateStepList(stepIndex, "bonnesPratiques", [
                                                ...step.bonnesPratiques,
                                                "",
                                            ])
                                        }
                                        onChange={(index, value) =>
                                            updateStepList(
                                                stepIndex,
                                                "bonnesPratiques",
                                                step.bonnesPratiques.map((it, i) =>
                                                    i === index ? value : it,
                                                ),
                                            )
                                        }
                                        onRemove={(index) =>
                                            updateStepList(
                                                stepIndex,
                                                "bonnesPratiques",
                                                step.bonnesPratiques.filter((_, i) => i !== index),
                                            )
                                        }
                                    />
                                    <ListField
                                        label="Erreurs à éviter"
                                        placeholder="Erreur à éviter..."
                                        items={step.erreurs}
                                        onAdd={() =>
                                            updateStepList(stepIndex, "erreurs", [...step.erreurs, ""])
                                        }
                                        onChange={(index, value) =>
                                            updateStepList(
                                                stepIndex,
                                                "erreurs",
                                                step.erreurs.map((it, i) => (i === index ? value : it)),
                                            )
                                        }
                                        onRemove={(index) =>
                                            updateStepList(
                                                stepIndex,
                                                "erreurs",
                                                step.erreurs.filter((_, i) => i !== index),
                                            )
                                        }
                                    />
                                    <ListField
                                        label="Posture & Communication"
                                        placeholder="Posture..."
                                        items={step.posture}
                                        onAdd={() =>
                                            updateStepList(stepIndex, "posture", [...step.posture, ""])
                                        }
                                        onChange={(index, value) =>
                                            updateStepList(
                                                stepIndex,
                                                "posture",
                                                step.posture.map((it, i) => (i === index ? value : it)),
                                            )
                                        }
                                        onRemove={(index) =>
                                            updateStepList(
                                                stepIndex,
                                                "posture",
                                                step.posture.filter((_, i) => i !== index),
                                            )
                                        }
                                    />
                                    <ListField
                                        label="Verbatims préconisés"
                                        placeholder="Verbatim..."
                                        items={step.verbatims}
                                        onAdd={() =>
                                            updateStepList(stepIndex, "verbatims", [...step.verbatims, ""])
                                        }
                                        onChange={(index, value) =>
                                            updateStepList(
                                                stepIndex,
                                                "verbatims",
                                                step.verbatims.map((it, i) => (i === index ? value : it)),
                                            )
                                        }
                                        onRemove={(index) =>
                                            updateStepList(
                                                stepIndex,
                                                "verbatims",
                                                step.verbatims.filter((_, i) => i !== index),
                                            )
                                        }
                                    />
                                </Box>
                            </CardSurface>
                        ))}
                    </Box>

                    <Box className="my-8 h-px bg-[#ECEEF3]" />

                    <Box className="flex justify-end gap-3">
                        <Link
                            href="/methods"
                            className="flex h-11 items-center justify-center rounded-xl border border-[#E5E7EB] bg-white px-6 text-[14px] font-semibold text-[#374151] transition hover:border-[#D5D7DE]"
                        >
                            Annuler
                        </Link>
                        <Button
                            disabled={!canSubmit}
                            className={`flex h-11 items-center justify-center rounded-xl px-6 text-[14px] font-bold text-white transition ${
                                canSubmit
                                    ? "bg-[#5140F0] shadow-[0_10px_20px_rgba(81,64,240,0.18)] hover:bg-[#4635E7]"
                                    : "cursor-not-allowed bg-[#B9B2F8]"
                            }`}
                        >
                            Enregistrer
                        </Button>
                    </Box>
                </CardSurface>
            </Box>
        </Box>
    );
}
