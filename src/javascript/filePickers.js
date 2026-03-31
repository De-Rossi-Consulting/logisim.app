import { showOpenFilePicker, showSaveFilePicker } from 'show-open-file-picker'

export async function openFile(options) {
    // Native File System Access API
    try {
        return await showOpenFilePicker(options);
    }
    // Not present
    catch {
        return new Promise((resolve) => {
            const input = document.createElement('input');
            input.type = 'file';

            if (options?.types?.length) {
                input.accept = Object.values(options.types[0].accept).flat().join(",");
            }

            input.onchange = () => {
                const files = Array.from(input.files || []);
                resolve(files.map((f) => ({
                    isFallback: true,
                    file: f
                })));
            }
            input.click();
        })
    }
}

export async function saveFile(options, data) {
    // Native File System Access API (Chromium desktop, some Android)
    try {
        const handle = await showSaveFilePicker(options);
        return { isFallback: false, handle };
    } catch {
        // iOS/iPadOS Safari fallback: trigger a download instead of "saving to disk"
        const filename = options?.suggestedName || 'download';
        const blob = data instanceof Blob ? data : new Blob([data], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        // Safari can start the download asynchronously; revoking immediately can break it.
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        return { isFallback: true, filename };
    }
}