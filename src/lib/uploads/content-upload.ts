// Existing method files are stored in the legacy notation bucket.
// The logical ownership is still carried by method_resources vs notation_method_files.
export const CONTENT_UPLOAD_BUCKET = "notation_pdf";
export const QUIZ_UPLOAD_BUCKET = "quizzes";
export const SCENARIO_RESOURCE_UPLOAD_BUCKET = "resource_scenarios";
export const SESSION_BACKGROUND_UPLOAD_BUCKET = "session-backgrounds";
export const PERSONA_CV_UPLOAD_BUCKET = "personas-cvs";

export const CONTENT_RESOURCE_DELIVERY_TYPE = {
    file: "file",
    url: "url",
} as const;

export const CONTENT_RESOURCE_DELIVERY_TYPES = [
    CONTENT_RESOURCE_DELIVERY_TYPE.file,
    CONTENT_RESOURCE_DELIVERY_TYPE.url,
] as const;

export type ContentResourceDeliveryType = (typeof CONTENT_RESOURCE_DELIVERY_TYPES)[number];

export const CONTENT_RESOURCE_DELIVERY_OPTIONS = [
    { label: "Fichier", value: CONTENT_RESOURCE_DELIVERY_TYPE.file },
    { label: "URL", value: CONTENT_RESOURCE_DELIVERY_TYPE.url },
] as const;

const MEBIBYTE_BYTES = 1024 * 1024;

/** Application limits aligned with the current Supabase Storage plan. */
export const CONTENT_UPLOAD_SIZE_LIMITS_BYTES = {
    file: 25 * MEBIBYTE_BYTES,
    image: 10 * MEBIBYTE_BYTES,
    personaCv: 5 * MEBIBYTE_BYTES,
    video: 50 * MEBIBYTE_BYTES,
} as const;

export const CONTENT_UPLOAD_ERROR_MESSAGES = {
    forbidden: "L'upload n'est pas autorisé ou son lien sécurisé a expiré. Réessayez.",
    invalidType: "Le format du fichier n'est pas accepté.",
    network: "La connexion au service de fichiers a été interrompue. Vérifiez votre connexion et réessayez.",
    storageFull: "L'espace de stockage disponible est insuffisant. Contactez un administrateur.",
    storageNotConfigured: "Le stockage de fichiers n'est pas configuré. Contactez un administrateur.",
    unavailable: "Le service de fichiers est temporairement indisponible. Réessayez dans quelques instants.",
    unknown: "L'upload du fichier a échoué. Vérifiez le fichier et réessayez.",
} as const;

export const MAX_CONTENT_UPLOAD_SIZE_BYTES = CONTENT_UPLOAD_SIZE_LIMITS_BYTES.file;
export const MAX_PERSONA_CV_UPLOAD_SIZE_BYTES = CONTENT_UPLOAD_SIZE_LIMITS_BYTES.personaCv;
export const MAX_SESSION_BACKGROUND_UPLOAD_SIZE_BYTES = CONTENT_UPLOAD_SIZE_LIMITS_BYTES.image;
export const MAX_VIDEO_UPLOAD_SIZE_BYTES = CONTENT_UPLOAD_SIZE_LIMITS_BYTES.video;

export const CONTENT_UPLOAD_RESOURCE_TYPES = ["document", "video", "audio", "image"] as const;

export type ContentUploadResourceType = (typeof CONTENT_UPLOAD_RESOURCE_TYPES)[number];

export const CONTENT_UPLOAD_PURPOSES = {
    coachAvatar: "coach_avatar",
    contentAsset: "content_asset",
    methodDocument: "method_document",
    personaAvatar: "persona_avatar",
    personaCv: "persona_cv",
    quizAttachment: "quiz_attachment",
    scenarioResource: "scenario_resource",
    sessionBackground: "session_background",
} as const;

export const DIRECT_CONTENT_UPLOAD_PURPOSES = [
    CONTENT_UPLOAD_PURPOSES.contentAsset,
    CONTENT_UPLOAD_PURPOSES.methodDocument,
    CONTENT_UPLOAD_PURPOSES.personaCv,
    CONTENT_UPLOAD_PURPOSES.quizAttachment,
    CONTENT_UPLOAD_PURPOSES.scenarioResource,
] as const;

export type DirectContentUploadPurpose = (typeof DIRECT_CONTENT_UPLOAD_PURPOSES)[number];

export const DIRECT_CONTENT_UPLOAD_BUCKET_BY_PURPOSE = {
    [CONTENT_UPLOAD_PURPOSES.contentAsset]: CONTENT_UPLOAD_BUCKET,
    [CONTENT_UPLOAD_PURPOSES.methodDocument]: CONTENT_UPLOAD_BUCKET,
    [CONTENT_UPLOAD_PURPOSES.personaCv]: PERSONA_CV_UPLOAD_BUCKET,
    [CONTENT_UPLOAD_PURPOSES.quizAttachment]: QUIZ_UPLOAD_BUCKET,
    [CONTENT_UPLOAD_PURPOSES.scenarioResource]: SCENARIO_RESOURCE_UPLOAD_BUCKET,
} as const satisfies Record<DirectContentUploadPurpose, string>;

export type ContentUploadPurpose = (typeof CONTENT_UPLOAD_PURPOSES)[keyof typeof CONTENT_UPLOAD_PURPOSES];

const AVATAR_UPLOAD_PURPOSES: readonly ContentUploadPurpose[] = [
    CONTENT_UPLOAD_PURPOSES.coachAvatar,
    CONTENT_UPLOAD_PURPOSES.personaAvatar,
];

interface MimeConfig {
    extension: string;
    resourceType: ContentUploadResourceType;
}

export const CONTENT_UPLOAD_MIME_TYPES = {
    "application/msword": { extension: "doc", resourceType: "document" },
    "application/pdf": { extension: "pdf", resourceType: "document" },
    "application/vnd.ms-excel": { extension: "xls", resourceType: "document" },
    "application/vnd.ms-powerpoint": { extension: "ppt", resourceType: "document" },
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": {
        extension: "pptx",
        resourceType: "document",
    },
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
        extension: "xlsx",
        resourceType: "document",
    },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
        extension: "docx",
        resourceType: "document",
    },
    "audio/mpeg": { extension: "mp3", resourceType: "audio" },
    "audio/mp4": { extension: "m4a", resourceType: "audio" },
    "audio/ogg": { extension: "ogg", resourceType: "audio" },
    "audio/wav": { extension: "wav", resourceType: "audio" },
    "image/jpeg": { extension: "jpg", resourceType: "image" },
    "image/png": { extension: "png", resourceType: "image" },
    "image/webp": { extension: "webp", resourceType: "image" },
    "text/csv": { extension: "csv", resourceType: "document" },
    "text/markdown": { extension: "md", resourceType: "document" },
    "text/plain": { extension: "txt", resourceType: "document" },
    "text/x-markdown": { extension: "md", resourceType: "document" },
    "video/mp4": { extension: "mp4", resourceType: "video" },
    "video/quicktime": { extension: "mov", resourceType: "video" },
    "video/webm": { extension: "webm", resourceType: "video" },
} satisfies Record<string, MimeConfig>;

export const CONTENT_UPLOAD_ACCEPT = Object.keys(CONTENT_UPLOAD_MIME_TYPES).join(",");

const DOCUMENT_UPLOAD_MIME_TYPES = Object.entries(CONTENT_UPLOAD_MIME_TYPES)
    .filter(([, config]) => config.resourceType === "document")
    .map(([mimeType]) => mimeType);

export const DOCUMENT_UPLOAD_ACCEPT = DOCUMENT_UPLOAD_MIME_TYPES.join(",");

export const PERSONA_CV_UPLOAD_MIME_TYPE = "application/pdf";
export const PERSONA_CV_UPLOAD_ACCEPT = PERSONA_CV_UPLOAD_MIME_TYPE;

const QUIZ_ATTACHMENT_UPLOAD_MIME_TYPES = Object.entries(CONTENT_UPLOAD_MIME_TYPES)
    .filter(([, config]) => ["document", "image", "video", "audio"].includes(config.resourceType))
    .map(([mimeType]) => mimeType);

export const QUIZ_ATTACHMENT_UPLOAD_ACCEPT = QUIZ_ATTACHMENT_UPLOAD_MIME_TYPES.join(",");

const IMAGE_UPLOAD_MIME_TYPES = Object.entries(CONTENT_UPLOAD_MIME_TYPES)
    .filter(([, config]) => config.resourceType === "image")
    .map(([mimeType]) => mimeType);

export const IMAGE_UPLOAD_ACCEPT = IMAGE_UPLOAD_MIME_TYPES.join(",");

export interface ContentUploadFileLike {
    name: string;
    size: number;
    type: string;
}

function formatUploadLimit(sizeBytes: number) {
    return `${sizeBytes / MEBIBYTE_BYTES} Mo`;
}

export function getContentUploadAccept(purpose: ContentUploadPurpose = CONTENT_UPLOAD_PURPOSES.contentAsset) {
    if (purpose === CONTENT_UPLOAD_PURPOSES.personaCv) return PERSONA_CV_UPLOAD_ACCEPT;
    if (purpose === CONTENT_UPLOAD_PURPOSES.methodDocument) return DOCUMENT_UPLOAD_ACCEPT;
    if (purpose === CONTENT_UPLOAD_PURPOSES.quizAttachment) return QUIZ_ATTACHMENT_UPLOAD_ACCEPT;
    if (
        AVATAR_UPLOAD_PURPOSES.includes(purpose) ||
        purpose === CONTENT_UPLOAD_PURPOSES.sessionBackground
    ) return IMAGE_UPLOAD_ACCEPT;

    return CONTENT_UPLOAD_ACCEPT;
}

export function getContentUploadLimitLabel(
    purpose: ContentUploadPurpose = CONTENT_UPLOAD_PURPOSES.contentAsset,
) {
    if (
        AVATAR_UPLOAD_PURPOSES.includes(purpose) ||
        purpose === CONTENT_UPLOAD_PURPOSES.sessionBackground
    ) {
        return `Images JPG, PNG ou WebP : ${formatUploadLimit(MAX_SESSION_BACKGROUND_UPLOAD_SIZE_BYTES)} maximum.`;
    }

    if (purpose === CONTENT_UPLOAD_PURPOSES.methodDocument) {
        return `Documents : ${formatUploadLimit(MAX_CONTENT_UPLOAD_SIZE_BYTES)} maximum.`;
    }

    if (purpose === CONTENT_UPLOAD_PURPOSES.personaCv) {
        return `CV au format PDF : ${formatUploadLimit(MAX_PERSONA_CV_UPLOAD_SIZE_BYTES)} maximum.`;
    }

    return `Vidéos : ${formatUploadLimit(MAX_VIDEO_UPLOAD_SIZE_BYTES)} maximum. Autres fichiers : ${formatUploadLimit(MAX_CONTENT_UPLOAD_SIZE_BYTES)} maximum.`;
}

export function getContentUploadMimeConfig(mimeType: string) {
    return CONTENT_UPLOAD_MIME_TYPES[mimeType as keyof typeof CONTENT_UPLOAD_MIME_TYPES] ?? null;
}

export function inferContentUploadResourceType(mimeType: string): ContentUploadResourceType {
    return getContentUploadMimeConfig(mimeType)?.resourceType ?? "document";
}

export function getContentUploadMaxSizeBytes(
    file: Pick<ContentUploadFileLike, "type">,
    purpose: ContentUploadPurpose = CONTENT_UPLOAD_PURPOSES.contentAsset,
) {
    const resourceType = getContentUploadMimeConfig(file.type)?.resourceType;
    const isLimitedImage =
        AVATAR_UPLOAD_PURPOSES.includes(purpose) ||
        purpose === CONTENT_UPLOAD_PURPOSES.sessionBackground;

    if (purpose === CONTENT_UPLOAD_PURPOSES.personaCv) {
        return MAX_PERSONA_CV_UPLOAD_SIZE_BYTES;
    }

    if (isLimitedImage) {
        return MAX_SESSION_BACKGROUND_UPLOAD_SIZE_BYTES;
    }

    if (
        DIRECT_CONTENT_UPLOAD_PURPOSES.includes(purpose as DirectContentUploadPurpose) &&
        resourceType === "video"
    ) {
        return MAX_VIDEO_UPLOAD_SIZE_BYTES;
    }

    return MAX_CONTENT_UPLOAD_SIZE_BYTES;
}

export function getContentUploadSizeErrorMessage(
    file: Pick<ContentUploadFileLike, "type">,
    purpose: ContentUploadPurpose = CONTENT_UPLOAD_PURPOSES.contentAsset,
) {
    const maxSizeBytes = getContentUploadMaxSizeBytes(file, purpose);
    const resourceType = getContentUploadMimeConfig(file.type)?.resourceType;
    const isLimitedImage =
        AVATAR_UPLOAD_PURPOSES.includes(purpose) ||
        purpose === CONTENT_UPLOAD_PURPOSES.sessionBackground;

    if (purpose === CONTENT_UPLOAD_PURPOSES.personaCv) {
        return `Le CV ne doit pas dépasser ${formatUploadLimit(maxSizeBytes)}.`;
    }

    if (isLimitedImage) {
        if (purpose === CONTENT_UPLOAD_PURPOSES.coachAvatar) {
            return `L'avatar du coach ne doit pas dépasser ${formatUploadLimit(maxSizeBytes)}.`;
        }

        if (purpose === CONTENT_UPLOAD_PURPOSES.personaAvatar) {
            return `L'avatar du persona ne doit pas dépasser ${formatUploadLimit(maxSizeBytes)}.`;
        }

        return `L'image de fond ne doit pas dépasser ${formatUploadLimit(maxSizeBytes)}.`;
    }

    if (resourceType === "video") {
        return `La vidéo dépasse ${formatUploadLimit(maxSizeBytes)}, la limite actuelle. Compressez-la ou utilisez une URL YouTube/Vimeo.`;
    }

    return `Le fichier ne doit pas dépasser ${formatUploadLimit(maxSizeBytes)}.`;
}

export function validateContentUploadFile(
    file: ContentUploadFileLike,
    purpose: ContentUploadPurpose = CONTENT_UPLOAD_PURPOSES.contentAsset,
) {
    const mimeConfig = getContentUploadMimeConfig(file.type);

    if (!mimeConfig) {
        return "Format de fichier non supporté.";
    }

    if (purpose === CONTENT_UPLOAD_PURPOSES.methodDocument && mimeConfig.resourceType !== "document") {
        return "Les ressources complémentaires acceptent uniquement des documents.";
    }

    if (
        purpose === CONTENT_UPLOAD_PURPOSES.personaCv &&
        (file.type !== PERSONA_CV_UPLOAD_MIME_TYPE || !file.name.toLocaleLowerCase("fr-FR").endsWith(".pdf"))
    ) {
        return "Le CV doit être un fichier PDF.";
    }

    if (
        purpose === CONTENT_UPLOAD_PURPOSES.quizAttachment &&
        !["document", "image", "video", "audio"].includes(mimeConfig.resourceType)
    ) {
        return "Les pièces jointes de quiz acceptent uniquement des documents, images, vidéos ou audios.";
    }

    if (purpose === CONTENT_UPLOAD_PURPOSES.sessionBackground && mimeConfig.resourceType !== "image") {
        return "Le fond de session accepte uniquement une image JPG, PNG ou WebP.";
    }

    if (AVATAR_UPLOAD_PURPOSES.includes(purpose) && mimeConfig.resourceType !== "image") {
        return purpose === CONTENT_UPLOAD_PURPOSES.coachAvatar
            ? "L'avatar du coach accepte uniquement une image JPG, PNG ou WebP."
            : "L'avatar du persona accepte uniquement une image JPG, PNG ou WebP.";
    }

    if (file.size <= 0) {
        return "Le fichier est vide.";
    }

    const maxSizeBytes = getContentUploadMaxSizeBytes(file, purpose);

    if (file.size > maxSizeBytes) {
        return getContentUploadSizeErrorMessage(file, purpose);
    }

    return null;
}

export function hasPdfFileSignature(bytes: ArrayLike<number>) {
    return (
        bytes.length >= 5 &&
        bytes[0] === 0x25 &&
        bytes[1] === 0x50 &&
        bytes[2] === 0x44 &&
        bytes[3] === 0x46 &&
        bytes[4] === 0x2d
    );
}

export function sanitizeUploadFileName(fileName: string, mimeType: string) {
    const configuredExtension = getContentUploadMimeConfig(mimeType)?.extension ?? "bin";
    const trimmedName = fileName.trim();
    const extensionMatch = trimmedName.match(/\.([a-zA-Z0-9]{1,12})$/);
    const extension = (extensionMatch?.[1] ?? configuredExtension).toLowerCase();
    const baseName = trimmedName.replace(/\.[a-zA-Z0-9]{1,12}$/, "");
    const normalizedBaseName = baseName
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 80);

    return `${normalizedBaseName || "document"}.${extension}`;
}

export function getStoragePathFileName(path: string) {
    return path.split("/").filter(Boolean).pop() ?? "document";
}

export function formatUploadFileSize(sizeBytes: number | null | undefined) {
    if (!sizeBytes || sizeBytes <= 0) {
        return "";
    }

    if (sizeBytes < 1024 * 1024) {
        return `${Math.ceil(sizeBytes / 1024)} Ko`;
    }

    const megabytes = sizeBytes / (1024 * 1024);
    return `${megabytes.toFixed(megabytes >= 10 ? 0 : 1)} Mo`;
}
