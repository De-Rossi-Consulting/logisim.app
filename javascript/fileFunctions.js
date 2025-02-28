// Functions used by wasm to interact with local files

// Basic file functions
// used for reading/writing one file 

function Java_com_cburch_logisim_gui_main_ExportThread_DownloadFile(filename, filedata) {
    const blob = new Blob([filedata], {type: 'application/octet-stream'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}