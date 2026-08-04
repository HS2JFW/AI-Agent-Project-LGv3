import fs from 'fs/promises';

export async function uploadFileToGoogle(filePath: string, apiKey: string, mimeType: string = "application/pdf"): Promise<string | null> {
    const url = `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${apiKey}&uploadType=media`;
    const headers = {
        "Content-Type": mimeType
    };
    try {
        const fileData = await fs.readFile(filePath);
        return await uploadBytesToGoogle(fileData, apiKey, mimeType);
    } catch (e) {
        console.log(`[Google File API] Exception during upload: ${e}`);
        return null;
    }
}

export async function uploadBytesToGoogle(fileBytes: Buffer | Uint8Array, apiKey: string, mimeType: string = "application/pdf"): Promise<string | null> {
    const url = `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${apiKey}&uploadType=media`;
    const headers = {
        "Content-Type": mimeType
    };
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: fileBytes as any
        });
        
        if (response.ok) {
            const respJson = await response.json();
            return respJson.file?.uri || null;
        } else {
            const errorText = await response.text();
            console.log(`[Google File API] Upload failed: HTTP ${response.status} - ${errorText}`);
            return null;
        }
    } catch (e) {
        console.log(`[Google File API] Exception during upload: ${e}`);
        return null;
    }
}
