import Link from "next/link";
import { Building2, ChevronLeft, ChevronRight, Eye, Pencil } from "lucide-react";
import { Box, Button, CardSurface, InlineIcon, Text } from "@/lib/ui/atoms";
import type { OrganizationListItem } from "@/features/organizations/domain/organization-list";
import { OrganizationStatusBadge } from "./OrganizationStatusBadge";

interface OrganizationsTableProps {
    organizations: OrganizationListItem[];
    totalOrganizationCount: number;
}

const columns = [
    "Entreprise",
    "Groupes",
    "Utilisateurs",
    "Formations",
    "Date de création",
    "Statut",
    "Actions",
];

export function OrganizationsTable({ organizations, totalOrganizationCount }: OrganizationsTableProps) {
    const hasOrganizations = organizations.length > 0;

    return (
        <CardSurface className="overflow-hidden rounded-[14px] border border-[#E1E4EB] shadow-none">
            <Box className="overflow-x-auto">
                <Box as="table" className="w-full min-w-[980px] border-collapse">
                    <Box as="thead">
                        <Box as="tr" className="border-b border-[#E3E6EE] bg-[#FBFCFE]">
                            {columns.map((column) => (
                                <Box
                                    as="th"
                                    key={column}
                                    className="px-5 py-3 text-left text-[12px] font-extrabold uppercase leading-5 tracking-[0.08em] text-[#737B8E]"
                                >
                                    {column}
                                </Box>
                            ))}
                        </Box>
                    </Box>

                    <Box as="tbody">
                        {hasOrganizations ? (
                            organizations.map((organization) => (
                                <Box
                                    as="tr"
                                    key={organization.id}
                                    className="border-b border-[#E7E9EF] last:border-b-0"
                                >
                                    <Box as="td" className="p-[17px]">
                                        <Box className="flex items-center gap-4">
                                            <Box className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E9ECFF] text-[#5140F0]">
                                                <InlineIcon icon={Building2} className="h-5 w-5" />
                                            </Box>
                                            <Text className="text-[14px] font-bold leading-5 text-[#171B2A]">
                                                {organization.name}
                                            </Text>
                                        </Box>
                                    </Box>
                                    <Box as="td" className="p-[17px] text-center md:text-left">
                                        <Text className="text-[14px] font-semibold text-[#202636]">
                                            {organization.groupCount}
                                        </Text>
                                    </Box>
                                    <Box as="td" className="p-[17px] text-center md:text-left">
                                        <Text className="text-[14px] font-semibold text-[#202636]">
                                            {organization.userCount}
                                        </Text>
                                    </Box>
                                    <Box as="td" className="p-[17px] text-center md:text-left">
                                        <Text className="text-[14px] font-semibold text-[#202636]">
                                            {organization.programCount}
                                        </Text>
                                    </Box>
                                    <Box as="td" className="p-[17px]">
                                        <Text className="text-[14px] font-semibold text-[#4F5868]">
                                            {organization.createdAt}
                                        </Text>
                                    </Box>
                                    <Box as="td" className="p-[17px]">
                                        <OrganizationStatusBadge status={organization.status} />
                                    </Box>
                                    <Box as="td" className="p-[17px]">
                                        <Box className="flex items-center gap-5 text-[#4F5868]">
                                            <Link
                                                href={`/organizations/${organization.id}`}
                                                aria-label={`Voir ${organization.name}`}
                                                className="flex h-8 w-8 items-center justify-center rounded-lg transition hover:bg-[#F2F3FF] hover:text-[#5140F0]"
                                            >
                                                <InlineIcon icon={Eye} className="h-5 w-5" />
                                            </Link>
                                            <Link
                                                href={`/organizations/${organization.id}?edit=1`}
                                                aria-label={`Modifier ${organization.name}`}
                                                className="flex h-8 w-8 items-center justify-center rounded-lg transition hover:bg-[#F2F3FF] hover:text-[#5140F0]"
                                            >
                                                <InlineIcon icon={Pencil} className="h-5 w-5" />
                                            </Link>
                                        </Box>
                                    </Box>
                                </Box>
                            ))
                        ) : (
                            <Box as="tr">
                                <Box as="td" colSpan={columns.length} className="h-[260px] px-6 py-12">
                                    <Box className="flex flex-col items-center justify-center text-center">
                                        <InlineIcon icon={Building2} className="mb-6 h-14 w-14 text-[#D1D5DE]" />
                                        <Text className="text-[14px] font-bold leading-5 text-[#171B2A]">
                                            Aucune entreprise trouvée
                                        </Text>
                                        <Text className="mt-3 text-[14px] font-semibold text-[#A0A6B5]">
                                            Essayez de modifier vos filtres
                                        </Text>
                                    </Box>
                                </Box>
                            </Box>
                        )}
                    </Box>
                </Box>
            </Box>

            <Box className="flex flex-col gap-4 border-t border-[#E7E9EF] px-7 py-5 md:flex-row md:items-center md:justify-between">
                <Text className="text-[14px] font-semibold text-[#737B8E]">
                    {hasOrganizations
                        ? `Affichage 1-${organizations.length} sur ${totalOrganizationCount} organisations`
                        : `Affichage 0 sur ${totalOrganizationCount} organisations`}
                </Text>

                <Box className="flex items-center gap-3">
                    <Button className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#E7E9EF] bg-white text-[#A2A9B8] transition hover:border-[#5140F0] hover:text-[#5140F0]">
                        <InlineIcon icon={ChevronLeft} className="h-5 w-5" />
                    </Button>
                    <Button className="flex h-10 min-w-10 items-center justify-center rounded-lg bg-[#5140F0] px-4 text-[14px] font-bold text-white">
                        1
                    </Button>
                    <Button className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#E7E9EF] bg-white text-[#A2A9B8] transition hover:border-[#5140F0] hover:text-[#5140F0]">
                        <InlineIcon icon={ChevronRight} className="h-5 w-5" />
                    </Button>
                </Box>
            </Box>
        </CardSurface>
    );
}
