"use client";

import { useState } from "react";
import { BookOpen, NotebookPen } from "lucide-react";
import { ContentResourcesList } from "@/features/content/components";
import type { PrepDocument } from "@/features/roleplays/data/preparation";
import {
    countRoleplayCoachNotes,
    type RoleplayCoachNoteGroup,
} from "@/features/roleplays/domain";
import { Box } from "@/lib/ui/atoms";
import { SegmentedControl } from "@/lib/ui/molecules";
import { Modal, VideoModal } from "@/lib/ui/organisms";
import { RoleplayCoachNotesViewer } from "./RoleplayCoachNotesModal";

type PreparationTab = "documents" | "notes";

interface RoleplayPreparationModalProps {
    documents: PrepDocument[];
    groups: RoleplayCoachNoteGroup[];
    onClose: () => void;
    onGroupSaved?: (group: RoleplayCoachNoteGroup) => void;
    roleplayId: string;
}

const preparationTabs = [
    { icon: BookOpen, label: "Documents", value: "documents" },
    { icon: NotebookPen, label: "Notes", value: "notes" },
] as const;

/** Espace de préparation unique : ressources du scénario et notes personnelles éditables. */
export function RoleplayPreparationModal({
    documents,
    groups,
    onClose,
    onGroupSaved,
    roleplayId,
}: RoleplayPreparationModalProps) {
    const [activeTab, setActiveTab] = useState<PreparationTab>("documents");
    const [selectedVideo, setSelectedVideo] = useState<{ title: string; url: string } | null>(null);
    const noteCount = countRoleplayCoachNotes(groups);

    if (selectedVideo) {
        return (
            <VideoModal
                description="Ressource vidéo"
                onClose={() => setSelectedVideo(null)}
                title={selectedVideo.title}
                url={selectedVideo.url}
            />
        );
    }

    return (
        <Modal
            className="max-w-[680px]"
            description={`${documents.length} ressource${documents.length !== 1 ? "s" : ""} · ${noteCount} note${noteCount !== 1 ? "s" : ""}`}
            onClose={onClose}
            title="Documents de préparation"
        >
            <Box className="space-y-4">
                <SegmentedControl
                    ariaLabel="Contenu de préparation"
                    onChange={setActiveTab}
                    options={preparationTabs}
                    value={activeTab}
                />

                {activeTab === "documents" ? (
                    <ContentResourcesList
                        documents={documents}
                        emptyMessage="Aucun document de préparation n'est associé à ce scénario."
                        onSelectVideo={setSelectedVideo}
                    />
                ) : (
                    <RoleplayCoachNotesViewer
                        groups={groups}
                        onGroupSaved={onGroupSaved}
                        roleplayId={roleplayId}
                    />
                )}
            </Box>
        </Modal>
    );
}
