"use client";

import { useState } from "react";
import { Eye, Pencil, Plus, Trash2, UsersRound } from "lucide-react";
import { Box, Button, CardSurface, InlineIcon, Text } from "@/lib/ui/atoms";
import { demoOrganizationGroups } from "@/features/organizations/domain/organization-detail";
import { CreateGroupModal } from "./CreateGroupModal";
import { OrganizationProgressBar } from "./OrganizationProgressBar";

const columns = ["Groupe", "Membres", "Formations", "Progression", "Actions"];

function progressColor(progress: number) {
    if (progress >= 75) {
        return "green" as const;
    }

    if (progress >= 60) {
        return "yellow" as const;
    }

    return "orange" as const;
}

export function OrganizationDetailGroups() {
    const [groups, setGroups] = useState(demoOrganizationGroups);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [groupName, setGroupName] = useState("");
    const [groupDescription, setGroupDescription] = useState("");

    const closeCreateModal = () => {
        setIsCreateModalOpen(false);
        setGroupName("");
        setGroupDescription("");
    };

    const createGroup = () => {
        const trimmedGroupName = groupName.trim();

        if (!trimmedGroupName) {
            return;
        }

        setGroups((currentGroups) => [
            ...currentGroups,
            {
                formationCount: 0,
                id: `${trimmedGroupName.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
                memberCount: 0,
                name: trimmedGroupName,
                progress: 0,
            },
        ]);
        closeCreateModal();
    };

    return (
        <Box className="px-7 py-7">
            <Box className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <Text as="h2" className="text-[18px] font-extrabold text-[#171B2A]">
                    {"Groupes de l'organisation"}
                </Text>
                <Button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex h-10 items-center gap-3 rounded-lg bg-[#E5E9FF] px-5 text-[14px] font-bold text-[#5140F0] transition hover:bg-[#DBE0FF]"
                >
                    <InlineIcon icon={Plus} className="h-5 w-5" />
                    Créer un groupe
                </Button>
            </Box>

            <CardSurface className="overflow-hidden rounded-[14px] border border-[#E1E4EB] shadow-none">
                <Box className="overflow-x-auto">
                    <Box as="table" className="w-full min-w-[920px] border-collapse">
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
                            {groups.map((group) => (
                                <Box as="tr" key={group.id} className="border-b border-[#E7E9EF] last:border-b-0">
                                    <Box as="td" className="px-7 py-5">
                                        <Box className="flex items-center gap-4">
                                            <Box className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E7EAFF] text-[#5140F0]">
                                                <InlineIcon icon={UsersRound} className="h-5 w-5" />
                                            </Box>
                                            <Text className="text-[14px] font-extrabold text-[#171B2A]">{group.name}</Text>
                                        </Box>
                                    </Box>
                                    <Box as="td" className="px-7 py-5">
                                        <Text className="text-[14px] font-semibold text-[#202636]">
                                            {group.memberCount} membres
                                        </Text>
                                    </Box>
                                    <Box as="td" className="px-7 py-5">
                                        <Text className="text-[14px] font-semibold text-[#202636]">
                                            {group.formationCount}
                                        </Text>
                                    </Box>
                                    <Box as="td" className="px-7 py-5">
                                        <OrganizationProgressBar
                                            color={progressColor(group.progress)}
                                            progress={group.progress}
                                            size="sm"
                                        />
                                    </Box>
                                    <Box as="td" className="px-7 py-5">
                                        <Box className="flex items-center gap-5 text-[#9AA2B2]">
                                            {[Eye, Pencil, Trash2].map((icon) => (
                                                <Button
                                                    key={icon.displayName ?? icon.name}
                                                    className="flex h-8 w-8 items-center justify-center rounded-lg transition hover:bg-[#F2F3FF] hover:text-[#5140F0]"
                                                >
                                                    <InlineIcon icon={icon} className="h-5 w-5" />
                                                </Button>
                                            ))}
                                        </Box>
                                    </Box>
                                </Box>
                            ))}
                        </Box>
                    </Box>
                </Box>
            </CardSurface>

            {isCreateModalOpen && (
                <CreateGroupModal
                    description={groupDescription}
                    groupName={groupName}
                    onClose={closeCreateModal}
                    onDescriptionChange={setGroupDescription}
                    onGroupNameChange={setGroupName}
                    onSubmit={createGroup}
                />
            )}
        </Box>
    );
}
