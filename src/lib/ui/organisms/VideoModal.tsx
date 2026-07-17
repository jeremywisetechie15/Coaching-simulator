"use client";

import { VideoPlayer } from "@/lib/ui/molecules";
import { uiTokens } from "@/lib/ui/tokens";
import { Modal } from "./Modal";

interface VideoModalProps {
    description?: string;
    onClose: () => void;
    title: string;
    url: string;
}

/** Modal vidéo SSOT pour les fichiers uploadés, les URLs directes, YouTube et Vimeo. */
export function VideoModal({ description, onClose, title, url }: VideoModalProps) {
    return (
        <Modal
            className={uiTokens.videoPlayer.modalPanel}
            description={description}
            onClose={onClose}
            title={title}
        >
            <VideoPlayer src={url} title={title} />
        </Modal>
    );
}
