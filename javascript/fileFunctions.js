// Functions used by wasm to interact with local files

// Basic file functions
// used for reading/writing one file 

//Export Image
async function Java_com_cburch_logisim_gui_main_ExportImage_DownloadFile(lib, filename, filedata) {
    console.log(`Creating download for file: ${filename}`);

    const byteCharacters = atob(filedata);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);

    const blob = new Blob([byteArray], {type: 'application/octet-stream'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

//Save as
async function Java_com_cburch_logisim_gui_menu_Popups_SendFileData(lib, data) {
    console.log("Recieved file to save");

    try {
        const fileLoc = await window.showSaveFilePicker({
            suggestedName: "",
            types: [{
                descrption: "Logisim Circuit Files",
                accept: {"application/octet-stream" : [".circ"]}
            }]
        });

        const writableStream = await fileLoc.createWritable();
        await writableStream.write(data);
        await writableStream.close();

        console.log("File saved successfully!");
    } catch (error) {
        console.error("Failed to save file: ", error)
    }
}