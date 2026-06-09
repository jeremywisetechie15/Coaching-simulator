"use client";

import Link from "next/link";
import {
    ArrowLeft,
    ArrowRight,
    BookOpen,
    CheckCircle2,
    ChevronDown,
    Clock,
    FileText,
    MessageSquare,
    Phone,
    Play,
    ShieldCheck,
    Target,
    Video,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useState } from "react";
import { Box, Button, CardSurface, InlineIcon, Text } from "@/lib/ui/atoms";
import type { Method, MethodStep, MethodStepIcon } from "@/features/methods/data/methods";

const stepIcons: Record<MethodStepIcon, { icon: LucideIcon; bg: string; color: string }> = {
    phone: { icon: Phone, bg: "#E7EDFD", color: "#3B6FD0" },
    message: { icon: MessageSquare, bg: "#F3E8FD", color: "#8B2FD6" },
    shield: { icon: ShieldCheck, bg: "#E7F9ED", color: "#16A34A" },
    check: { icon: CheckCircle2, bg: "#FEECF0", color: "#E11D6B" },
};

function BulletGroup({ title, items }: { title: string; items: string[] }) {
    return (
        <Box>
            <Text as="p" className="text-[14px] font-extrabold text-[#111827]">
                {title}
            </Text>
            <Box className="mt-2 space-y-2">
                {items.map((item) => (
                    <Box key={item} className="flex gap-2.5">
                        <Box className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#5140F0]" />
                        <Text className="text-[14px] font-medium leading-6 text-[#4B5563]">{item}</Text>
                    </Box>
                ))}
            </Box>
        </Box>
    );
}

function StepAccordion({ step }: { step: MethodStep }) {
    const [open, setOpen] = useState(false);
    const config = stepIcons[step.icon];

    return (
        <CardSurface className="overflow-hidden rounded-[14px] border border-[#E5E7EB] shadow-none">
            <button
                type="button"
                aria-expanded={open}
                onClick={() => setOpen((value) => !value)}
                className="flex w-full items-center gap-4 px-5 py-4 text-left"
            >
                <Box
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                    style={{ backgroundColor: config.bg, color: config.color }}
                >
                    <InlineIcon icon={config.icon} className="h-5 w-5" />
                </Box>
                <Text as="h3" className="flex-1 text-[16px] font-bold text-[#111827]">
                    {step.title}
                </Text>
                <InlineIcon
                    icon={ChevronDown}
                    className={`h-5 w-5 shrink-0 text-[#9CA3AF] transition-transform ${open ? "rotate-180" : ""}`}
                />
            </button>

            {open && (
                <Box className="border-t border-[#ECEEF3] px-5 py-5">
                    <Text className="text-[14px] font-medium leading-6 text-[#4B5563]">{step.summary}</Text>

                    <Box className="mt-4 flex flex-col gap-3 rounded-[12px] border border-[#FBD9B4] bg-[#FFF7ED] p-4 md:flex-row md:items-center md:justify-between">
                        <Box>
                            <Box className="flex items-center gap-2">
                                <InlineIcon icon={Video} className="h-4 w-4 text-[#EA580C]" />
                                <Text as="p" className="text-[14px] font-bold text-[#111827]">
                                    Capsules E-learning
                                </Text>
                            </Box>
                            <Box className="mt-1 flex items-center gap-1.5">
                                <InlineIcon icon={Play} className="h-3.5 w-3.5 text-[#EA580C]" />
                                <Text className="text-[13px] font-medium text-[#6B7280]">
                                    {step.capsule.title}{" "}
                                    <Text as="span" className="text-[#9CA3AF]">
                                        ({step.capsule.duration})
                                    </Text>
                                </Text>
                            </Box>
                        </Box>
                        <Button className="flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg bg-[#EA580C] px-4 text-[13px] font-bold text-white transition hover:bg-[#DC4F08]">
                            <InlineIcon icon={Play} className="h-4 w-4" />
                            Voir la vidéo
                        </Button>
                    </Box>

                    <Box className="mt-4 rounded-[12px] bg-[#F8F5FE] p-5">
                        <Box className="flex items-center gap-2">
                            <InlineIcon icon={Target} className="h-4 w-4 text-[#8B2FD6]" />
                            <Text as="p" className="text-[14px] font-extrabold text-[#111827]">
                                Objectifs et enjeux
                            </Text>
                        </Box>
                        <Box className="mt-2 space-y-2">
                            {step.objectifs.map((item) => (
                                <Box key={item} className="flex gap-2.5">
                                    <Box className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#8B2FD6]" />
                                    <Text className="text-[14px] font-medium leading-6 text-[#4B5563]">{item}</Text>
                                </Box>
                            ))}
                        </Box>
                    </Box>

                    <Box className="mt-5 space-y-5">
                        <BulletGroup title="Bonnes pratiques" items={step.bonnesPratiques} />
                        <BulletGroup title="Erreurs à éviter" items={step.erreurs} />
                        <BulletGroup title="Posture & Communication" items={step.posture} />
                        <BulletGroup title="Verbatims préconisés" items={step.verbatims} />
                    </Box>

                    <Button className="mt-5 flex h-10 items-center justify-center gap-2 rounded-lg border border-[#C9C2FB] bg-white px-4 text-[13px] font-bold text-[#5140F0] transition hover:bg-[#F4F3FE]">
                        <InlineIcon icon={FileText} className="h-4 w-4" />
                        Vérifier mes connaissances sur cette étape
                    </Button>
                </Box>
            )}
        </CardSurface>
    );
}

export function MethodDetailPageContent({ method }: { method: Method }) {
    return (
        <Box as="main" className="px-5 pb-16 md:px-9 lg:px-12">
            <Box className="mx-auto max-w-[1180px]">
                <Box className="mb-5">
                    <Link
                        href="/methods"
                        className="inline-flex items-center gap-2 text-[14px] font-semibold text-[#4B5563] transition hover:text-[#111827]"
                    >
                        <InlineIcon icon={ArrowLeft} className="h-4 w-4" />
                        Retour aux méthodes
                    </Link>
                </Box>

                <CardSurface className="rounded-[24px] border border-[#E9E7FB] p-7 shadow-[0_1px_2px_rgba(17,24,39,0.04)] md:p-9">
                    <Box className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                        <Box className="flex-1">
                            <Text as="h1" className="text-[28px] font-extrabold text-[#111827] md:text-[32px]">
                                {method.name}
                            </Text>
                            <Text className="mt-4 text-[14px] font-medium leading-7 text-[#4B5563]">
                                {method.description}
                            </Text>
                            <Box className="mt-5 flex flex-wrap gap-3">
                                <Box className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#E5E7EB] bg-white px-3.5 text-[13px] font-semibold text-[#4B5563]">
                                    <InlineIcon icon={Clock} className="h-4 w-4 text-[#9CA3AF]" />
                                    Temps de lecture : {method.readingTime}
                                </Box>
                                <Box className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#E5E7EB] bg-white px-3.5 text-[13px] font-semibold text-[#4B5563]">
                                    <InlineIcon icon={FileText} className="h-4 w-4 text-[#9CA3AF]" />
                                    Quiz associé: {method.quizQuestions} questions
                                </Box>
                            </Box>
                        </Box>

                        <Box className="flex w-full shrink-0 flex-col gap-3 lg:w-[300px]">
                            <Button className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[#C9C2FB] bg-white text-[14px] font-bold text-[#5140F0] transition hover:bg-[#F4F3FE]">
                                <InlineIcon icon={BookOpen} className="h-4 w-4" />
                                Ressources complémentaires
                            </Button>
                            <CardSurface className="rounded-[16px] border border-[#E5E7EB] bg-[#F7F8FB] p-5 shadow-none">
                                <Text className="text-[13px] font-semibold text-[#6B7280]">Maîtrise de la méthode</Text>
                                <Text as="h3" className="mt-1 text-[20px] font-extrabold text-[#111827]">
                                    Non testée
                                </Text>
                                <Button className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#5140F0] text-[13px] font-bold text-white transition hover:bg-[#4635E7]">
                                    <InlineIcon icon={FileText} className="h-4 w-4" />
                                    Vérifier mes connaissances
                                </Button>
                            </CardSurface>
                        </Box>
                    </Box>

                    <CardSurface className="mt-6 rounded-[16px] border border-[#E5E7EB] p-6 shadow-none">
                        <Text as="h3" className="text-[16px] font-bold text-[#111827]">
                            À retenir en 30 secondes
                        </Text>
                        <Box className="mt-4 flex flex-col gap-3 md:flex-row md:items-stretch">
                            {method.retenir.map((mini, index) => {
                                const config = stepIcons[method.steps[index]?.icon ?? "phone"];
                                return (
                                    <Box key={mini.title} className="flex flex-1 items-center gap-3">
                                        <Box className="flex-1 rounded-[12px] border border-[#E5E7EB] bg-white p-4">
                                            <Box
                                                className="flex h-9 w-9 items-center justify-center rounded-lg"
                                                style={{ backgroundColor: config.bg, color: config.color }}
                                            >
                                                <InlineIcon icon={config.icon} className="h-4 w-4" />
                                            </Box>
                                            <Text className="mt-2.5 text-[14px] font-bold text-[#111827]">
                                                {mini.title}
                                            </Text>
                                            <Text className="mt-0.5 text-[13px] font-medium leading-5 text-[#6B7280]">
                                                {mini.text}
                                            </Text>
                                        </Box>
                                        {index < method.retenir.length - 1 && (
                                            <InlineIcon
                                                icon={ArrowRight}
                                                className="hidden h-4 w-4 shrink-0 text-[#C9CED8] md:block"
                                            />
                                        )}
                                    </Box>
                                );
                            })}
                        </Box>
                    </CardSurface>

                    <Box className="mt-5 grid gap-5 lg:grid-cols-2">
                        <CardSurface className="rounded-[16px] border border-[#E5E7EB] bg-[#F7F8FB] p-6 shadow-none">
                            <Text as="h3" className="text-[16px] font-bold text-[#111827]">
                                Objectifs
                            </Text>
                            <Box className="mt-3 space-y-2.5">
                                {method.objectifs.map((item) => (
                                    <Box key={item} className="flex gap-2.5">
                                        <Box className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#5140F0]" />
                                        <Text className="text-[14px] font-medium leading-6 text-[#4B5563]">
                                            {item}
                                        </Text>
                                    </Box>
                                ))}
                            </Box>
                        </CardSurface>
                        <CardSurface className="rounded-[16px] border border-[#E5E7EB] bg-[#F7F8FB] p-6 shadow-none">
                            <Text as="h3" className="text-[16px] font-bold text-[#111827]">
                                Enjeux
                            </Text>
                            <Box className="mt-3 space-y-2.5">
                                {method.enjeux.map((item) => (
                                    <Box key={item} className="flex gap-2.5">
                                        <Box className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#5140F0]" />
                                        <Text className="text-[14px] font-medium leading-6 text-[#4B5563]">
                                            {item}
                                        </Text>
                                    </Box>
                                ))}
                            </Box>
                        </CardSurface>
                    </Box>

                    <Text as="h2" className="mt-7 text-[18px] font-extrabold text-[#111827]">
                        Objectif métier utilisant cette méthode
                    </Text>
                    <CardSurface className="mt-3 flex items-center justify-between gap-4 rounded-[14px] border border-[#E5E7EB] bg-[#F7F8FB] px-5 py-4 shadow-none">
                        <Box className="flex items-center gap-3">
                            <Box className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#EEF0FF]">
                                <InlineIcon icon={Target} className="h-5 w-5 text-[#5140F0]" />
                            </Box>
                            <Text className="text-[15px] font-bold text-[#111827]">{method.objectifMetier}</Text>
                        </Box>
                        <Box className="inline-flex h-7 items-center rounded-md bg-[#DCFCE7] px-2.5 text-[12px] font-bold text-[#16A34A]">
                            Actif
                        </Box>
                    </CardSurface>

                    <Text as="h2" className="mt-7 text-[18px] font-extrabold text-[#111827]">
                        Les {method.steps.length} étapes de la méthode
                    </Text>
                    <Box className="mt-3 space-y-3">
                        {method.steps.map((step) => (
                            <StepAccordion key={step.title} step={step} />
                        ))}
                    </Box>

                    <CardSurface className="mt-6 flex flex-col gap-4 rounded-[16px] border border-[#E5E7EB] bg-[#F7F8FB] p-6 shadow-none md:flex-row md:items-center md:justify-between">
                        <Box>
                            <Text as="h3" className="text-[16px] font-bold text-[#111827]">
                                Prêt à passer à l&apos;action ?
                            </Text>
                            <Text className="mt-1 text-[14px] font-medium text-[#6B7280]">
                                Vérifie ta compréhension, puis entraine-toi avec un roleplay IA.
                            </Text>
                        </Box>
                        <Box className="flex flex-wrap gap-3">
                            <Button className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#5140F0] px-5 text-[14px] font-bold text-white transition hover:bg-[#4635E7]">
                                <InlineIcon icon={FileText} className="h-4 w-4" />
                                Vérifier mes connaissances
                            </Button>
                            <Link
                                href="/roleplays"
                                className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[#C9C2FB] bg-white px-5 text-[14px] font-bold text-[#5140F0] transition hover:bg-[#F4F3FE]"
                            >
                                <InlineIcon icon={Phone} className="h-4 w-4" />
                                Lancer un roleplay
                            </Link>
                        </Box>
                    </CardSurface>
                </CardSurface>
            </Box>
        </Box>
    );
}
