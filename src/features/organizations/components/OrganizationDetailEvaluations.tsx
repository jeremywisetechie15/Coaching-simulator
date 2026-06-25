import { Fragment } from "react";
import { ChevronDown, UsersRound } from "lucide-react";
import { Box, CardSurface, InlineIcon, Text } from "@/lib/ui/atoms";
import {
    demoOrganizationEvaluations,
    type OrganizationEvaluationRow,
} from "@/features/organizations/domain/organization-detail";

const columns = ["Titre", "Type", "Groupe", "Apprenants", "Date d'assignation"];

const sectionLabels = {
    completed: "Évaluations terminées",
    in_progress: "Évaluations en cours",
    not_started: "Évaluations non commencées",
};

const groupedEvaluations: Array<{
    evaluations: OrganizationEvaluationRow[];
    status: OrganizationEvaluationRow["status"];
}> = [
    {
        evaluations: demoOrganizationEvaluations.filter((evaluation) => evaluation.status === "not_started"),
        status: "not_started",
    },
    {
        evaluations: demoOrganizationEvaluations.filter((evaluation) => evaluation.status === "in_progress"),
        status: "in_progress",
    },
    {
        evaluations: demoOrganizationEvaluations.filter((evaluation) => evaluation.status === "completed"),
        status: "completed",
    },
];

export function OrganizationDetailEvaluations() {
    return (
        <Box className="px-7 py-7">
            <Text as="h2" className="mb-6 text-[18px] font-extrabold text-[#171B2A]">
                Évaluations assignées (vue consolidée)
            </Text>

            <CardSurface className="overflow-hidden rounded-[14px] border border-[#E1E4EB] shadow-none">
                <Box className="overflow-x-auto">
                    <Box as="table" className="w-full min-w-[1000px] border-collapse">
                        <Box as="thead">
                            <Box as="tr" className="border-b border-[#E4E7EE] bg-[#FBFCFE]">
                                {columns.map((column) => (
                                    <Box
                                        as="th"
                                        key={column}
                                        className="px-7 py-4 text-left text-[12px] font-extrabold uppercase tracking-[0.08em] text-[#737B8E]"
                                    >
                                        {column}
                                    </Box>
                                ))}
                            </Box>
                        </Box>
                        <Box as="tbody">
                            {groupedEvaluations.map((group) => (
                                <Fragment key={group.status}>
                                    <Box as="tr" className="border-b border-[#E7E9EF] bg-[#FBFCFE]">
                                        <Box as="td" colSpan={columns.length} className="px-7 py-4">
                                            <Box className="flex items-center gap-3">
                                                <InlineIcon icon={ChevronDown} className="h-5 w-5 text-[#4F5868]" />
                                                <Text className="text-[15px] font-extrabold text-[#171B2A]">
                                                    {sectionLabels[group.status]} ({group.evaluations.length})
                                                </Text>
                                            </Box>
                                        </Box>
                                    </Box>
                                    {group.evaluations.map((evaluation) => (
                                        <Box
                                            as="tr"
                                            key={evaluation.id}
                                            className="border-b border-[#E7E9EF] last:border-b-0"
                                        >
                                            <Box as="td" className="px-7 py-5">
                                                <Text className="text-[14px] font-extrabold text-[#171B2A]">
                                                    {evaluation.title}
                                                </Text>
                                            </Box>
                                            <Box as="td" className="px-7 py-5">
                                                <Box className="inline-flex items-center rounded-lg bg-[#E8ECFF] px-3 py-1 text-[13px] font-semibold text-[#5140F0]">
                                                    {evaluation.type}
                                                </Box>
                                            </Box>
                                            <Box as="td" className="px-7 py-5">
                                                <Box className="flex items-center gap-3">
                                                    <Box className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E7EAFF] text-[#5140F0]">
                                                        <InlineIcon icon={UsersRound} className="h-5 w-5" />
                                                    </Box>
                                                    <Text className="text-[14px] font-semibold text-[#171B2A]">
                                                        {evaluation.groupName}
                                                    </Text>
                                                </Box>
                                            </Box>
                                            <Box as="td" className="px-7 py-5">
                                                <Text className="text-[14px] font-semibold text-[#171B2A]">
                                                    {evaluation.learnerCount} apprenant{evaluation.learnerCount > 1 ? "s" : ""}
                                                </Text>
                                            </Box>
                                            <Box as="td" className="px-7 py-5">
                                                <Text className="text-[14px] font-semibold text-[#4F5868]">
                                                    {evaluation.assignedAt}
                                                </Text>
                                            </Box>
                                        </Box>
                                    ))}
                                </Fragment>
                            ))}
                        </Box>
                    </Box>
                </Box>
            </CardSurface>
        </Box>
    );
}
