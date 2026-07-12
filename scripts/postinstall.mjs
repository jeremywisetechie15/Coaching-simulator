import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const scriptsDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = dirname(scriptsDirectory);

function resolveChromiumBinDirectory() {
    const chromiumEntryUrl = import.meta.resolve("@sparticuz/chromium");
    const chromiumEntryPath = fileURLToPath(chromiumEntryUrl);
    let chromiumPackageRoot = dirname(chromiumEntryPath);

    while (chromiumPackageRoot !== dirname(chromiumPackageRoot)) {
        if (
            existsSync(join(chromiumPackageRoot, "package.json")) &&
            existsSync(join(chromiumPackageRoot, "bin"))
        ) {
            return join(chromiumPackageRoot, "bin");
        }

        chromiumPackageRoot = dirname(chromiumPackageRoot);
    }

    throw new Error("Répertoire bin de @sparticuz/chromium introuvable.");
}

function createChromiumPack() {
    try {
        const chromiumBinDirectory = resolveChromiumBinDirectory();
        if (!existsSync(chromiumBinDirectory)) {
            console.warn("Chromium serverless absent : archive non générée.");
            return;
        }

        const publicDirectory = join(projectRoot, "public");
        const outputPath = join(publicDirectory, "chromium-pack.tar");
        mkdirSync(publicDirectory, { recursive: true });
        execFileSync("tar", ["-cf", outputPath, "-C", chromiumBinDirectory, "."], {
            cwd: projectRoot,
            stdio: "inherit",
        });
        console.log(`Archive Chromium générée : ${outputPath}`);
    } catch (error) {
        console.warn("Archive Chromium non générée. Le développement local reste disponible.", error);
    }
}

createChromiumPack();
