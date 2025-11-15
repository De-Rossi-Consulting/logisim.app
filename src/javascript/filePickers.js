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