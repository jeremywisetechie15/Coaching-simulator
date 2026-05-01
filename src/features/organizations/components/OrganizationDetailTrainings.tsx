import { Fragment } from "react";
import { ChevronDown, UsersRound } from "lucide-react";
import { Box, CardSurface, InlineIcon, Text } from "@/lib/ui/atoms";
import {
    demoOrganizationTrainings,
    type OrganizationTrainingRow,
} from "@/features/organizations/domain/organization-detail";
import { OrganizationProgressBar } from "./OrganizationProgressBar";

const columns = ["Formation", "Groupe", "Apprenants", "Statut", "Progression", "Date d'assignation"];

const sectionLabels = {
    completed: "Formations terminées",
    in_progress: "Formations en cours",
    not_started: "Formations non commencées",
};

const statusLabels = {
    completed: "Terminée",
    in_progress: "En cours",
    not_started: "Non commencée",
};

const statusClasses = {
    completed: "bg-[#DDF8E6] text-[#2A8A41]",
    in_progress: "bg-[#E0EAFF] text-[#3159F5]",
    not_started: "bg-[#F1F2F5] text-[#4F5868]",
};

const groupedTrainings: Array<{
    status: OrganizationTrainingRow["status"];
    trainings: OrganizationTrainingRow[];
}> = [
    {
        status: "not_started",
        trainings: demoOrganizationTrainings.filter((training) => training.status === "not_started"),
    },
    {
        status: "in_progress",
        trainings: demoOrganizationTrainings.filter((training) => training.status === "in_progress"),
    },
    {
        status: "completed",
        trainings: demoOrganizationTrainings.filter((training) => training.status === "completed"),
    },
];

export function OrganizationDetailTrainings() {
    return (
        <Box className="px-7 py-7">
            <Text as="h2" className="mb-6 text-[18px] font-extrabold text-[#171B2A]">
                Programmes assignés (vue consolidée)
            </Text>

            <CardSurface className="overflow-hidden rounded-[14px] border border-[#E1E4EB] shadow-none">
                <Box className="overflow-x-auto">
                    <Box as="table" className="w-full min-w-[1080px] border-collapse">
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
                            {groupedTrainings.map((group) => (
                                <Fragment key={group.status}>
                                    <Box
                                        as="tr"
                                        className="border-b border-[#E7E9EF] bg-[#FBFCFE]"
                                    >
                                        <Box as="td" colSpan={columns.length} className="px-7 py-4">
                                            <Box className="flex items-center gap-3">
                                                <InlineIcon icon={ChevronDown} className="h-5 w-5 text-[#4F5868]" />
                                                <Text className="text-[15px] font-extrabold text-[#171B2A]">
                                                    {sectionLabels[group.status]} ({group.trainings.length})
                                                </Text>
                                            </Box>
                                        </Box>
                                    </Box>
                                    {group.trainings.map((training) => (
                                        <Box
                                            as="tr"
                                            key={training.id}
                                            className="border-b border-[#E7E9EF] last:border-b-0"
                                        >
                                            <Box as="td" className="px-7 py-5">
                                                <Text className="text-[14px] font-extrabold text-[#171B2A]">
                                                    {training.title}
                                                </Text>
                                            </Box>
                                            <Box as="td" className="px-7 py-5">
                                                <Box className="flex items-center gap-3">
                                                    <Box className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E7EAFF] text-[#5140F0]">
                                                        <InlineIcon icon={UsersRound} className="h-5 w-5" />
                                                    </Box>
                                                    <Text className="text-[14px] font-semibold text-[#171B2A]">
                                                        {training.groupName}
                                                    </Text>
                                                </Box>
                                            </Box>
                                            <Box as="td" className="px-7 py-5">
                                                <Text className="text-[14px] font-semibold text-[#171B2A]">
                                                    {training.learnerCount} apprenants
                                                </Text>
                                            </Box>
                                            <Box as="td" className="px-7 py-5">
                                                <Box
                                                    className={`inline-flex h-8 items-center rounded-lg px-3 text-[13px] font-bold ${statusClasses[training.status]}`}
                                                >
                                                    {statusLabels[training.status]}
                                                </Box>
                                            </Box>
                                            <Box as="td" className="px-7 py-5">
                                                <OrganizationProgressBar progress={training.progress} />
                                            </Box>
                                            <Box as="td" className="px-7 py-5">
                                                <Text className="text-[14px] font-semibold text-[#4F5868]">
                                                    {training.assignedAt}
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
