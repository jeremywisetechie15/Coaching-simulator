import { Buffer } from "node:buffer";

export async function fileToStorageUploadBody(file: File): Promise<Buffer> {
    return Buffer.from(await file.arrayBuffer());
}
