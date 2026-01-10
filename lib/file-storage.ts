// lib/file-storage.ts
import { mkdir, unlink, writeFile } from 'fs/promises';
import path from 'path';

async function deleteOldFile(relativeUrl: string | null | undefined) {
    if (!relativeUrl || !relativeUrl.startsWith('/images')) return;
    try {
        const absolutePath = path.join(process.cwd(), 'public', relativeUrl);
        await unlink(absolutePath);
        console.log(`Successfully deleted: ${absolutePath}`);
    } catch (err) {
        console.warn("File deletion skipped:", err);
    }
}

async function saveFile(file: File | null, folder: string) {
    if (!file || typeof file === 'string' || !(file instanceof File)) return null;
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const uploadDir = path.join(process.cwd(), 'public', 'images', folder);
    await mkdir(uploadDir, { recursive: true });
    const fileName = `${Date.now()}-${file.name.replace(/\s/g, '_')}`;
    const filePath = path.join(uploadDir, fileName);
    await writeFile(filePath, buffer);
    return `/images/${folder}/${fileName}`;
}

// 🔑 Explicitly export at the bottom
export { deleteOldFile, saveFile };