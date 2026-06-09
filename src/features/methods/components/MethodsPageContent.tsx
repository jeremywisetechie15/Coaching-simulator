"use client";

import Link from "next/link";
import { ArrowLeft, BookOpen, Plus } from "lucide-react";
import { Box, CardSurface, InlineIcon, Text } from "@/lib/ui/atoms";
import { methods } from "@/features/methods/data/methods";

export function MethodsPageContent() {
    return (
        <Box as="main" className="px-5 pb-12 md:px-9 lg:px-12">
            <Box className="mx-auto max-w-[1260px]">
                <Box className="mb-9 flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                    <Box className="flex items-start gap-6">
                        <Link
                            href="/"
                            aria-label="Retour"
                            className="mt-2 flex h-8 w-8 items-center justify-center rounded-full text-[#111827] transition hover:bg-white"
                        >
                            <InlineIcon icon={ArrowLeft} className="h-5 w-5" />
                        </Link>
                        <Box>
                            <Text as="h1" className="text-[30px] font-extrabold leading-tight text-[#111827] md:text-[34px]">
                                Méthodes et Playbooks
                            </Text>
                            <Text className="mt-2 max-w-[680px] text-[15px] font-semibold leading-6 text-[#596273]">
                                Découvrez les méthodologies éprouvées pour évaluer votre apprentissage et pratique
                            </Text>
                        </Box>
                    </Box>

                    <Link
                        href="/methods/new"
                        className="mt-1 flex h-9 items-center justify-center gap-2.5 rounded-lg bg-[#5140F0] px-4 text-[13px] font-bold text-white shadow-[0_10px_20px_rgba(81,64,240,0.18)] transition hover:bg-[#4635E7] md:mt-2"
                    >
                        <InlineIcon icon={Plus} className="h-4 w-4" />
                        Créer une méthode
                    </Link>
                </Box>

                <Box className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {methods.map((method) => (
                        <Link key={method.id} href={`/methods/${method.id}`}>
                            <CardSurface className="flex min-h-[180px] flex-col rounded-[14px] border border-[#E5E7EB] p-6 shadow-none transition duration-200 hover:-translate-y-0.5 hover:border-[#D8DCE6] hover:shadow-[0_14px_34px_rgba(17,24,39,0.10)]">
                                <Text as="h3" className="text-[19px] font-extrabold leading-7 text-[#111827]">
                                    {method.name}
                                </Text>
                                <Text className="mt-2 flex-1 text-[14px] font-medium leading-6 text-[#596273]">
                                    {method.subtitle}
                                </Text>
                                <Box className="mt-4 inline-flex h-7 w-fit items-center rounded-md border border-[#93C5FD] bg-[#EFF6FF] px-2.5 text-[12px] font-semibold text-[#2563EB]">
                                    {method.category}
                                </Box>
                            </CardSurface>
                        </Link>
                    ))}
                </Box>

                {methods.length === 0 && (
                    <CardSurface className="rounded-[16px] border border-[#E5E7EB] px-8 py-16 text-center shadow-none">
                        <InlineIcon icon={BookOpen} className="mx-auto mb-5 h-12 w-12 text-[#C9CED8]" />
                        <Text className="text-[16px] font-extrabold text-[#111827]">Aucune méthode trouvée</Text>
                    </CardSurface>
                )}
            </Box>
        </Box>
    );
}
