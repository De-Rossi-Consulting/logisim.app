// Functions used by wasm to interact with local files

// Basic file functions
// used for reading/writing one file 

// Export Image
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

// Save
async function Java_com_cburch_logisim_gui_menu_MenuFile_SendFileData(lib, data, name, logisimFile, saveAs) {
    console.log("Recieved file to save");
    const fileHandlerId = await logisimFile.getFileHandleId()

    // Check if we are 'saving' or 'saving as'
    if (saveAs) { // Save as
        // Write the file to system memory
        try {
            const handler = await window.showSaveFilePicker({
                suggestedName: name,
                types: [{
                    descrption: "Logisim Circuit Files",
                    accept: {"application/octet-stream" : [".circ"]}
                }]
            });

            const writableStream = await handler.createWritable();
            await writableStream.write(data);
            await writableStream.close();
            
            // Save the file handler for later use so we can write to it again
            //using indexedDB so we can save without requesting permissions
            if (fileHandlerId == ""){
                const id = crypto.randomUUID();
                await logisimFile.setFileHandleId(id);
                saveFileHandler(handler, id);
            }
            else {
                saveFileHandler(handler, fileHandlerId);
            }

            await logisimFile.setSavedLocally(true);

            console.log("File saved successfully!");
        } catch (error) {
            console.error("Failed to save file: ", error)
        }
    } else { // Save
        const db = await window.idb.openDB("fileHandlersDB", 1,);
        handler = await db.get("handlers", fileHandlerId)

        const permissions = await handler.queryPermission({ mode: "readwrite" });

        if (permissions === "granted" || permissions === "prompt") {
            const writableStream = await handler.createWritable();
            await writableStream.write(data);
            await writableStream.close();

            console.log("File saved successfully!");
        }
        else {
            console.error("Save failed: Permission denied.")
        }
    }
}

// internal function for saving the fileHandler to indexedDB
async function saveFileHandler(fileHandler, id) {
    const db = await window.idb.openDB("fileHandlersDB", 1, {
        upgrade(db) {
            if (!db.objectStoreNames.contains("handlers")) {
                db.createObjectStore("handlers")
            }
        },
    });

    await db.put("handlers", fileHandler, id);
}

// save function
async function Java_com_cburch_logisim_proj_ProjectActions_SendFileData(lib, data, name, logisimFile) {
    console.log("Saving file");
    await Java_com_cburch_logisim_gui_menu_MenuFile_SendFileData(lib, data, name, logisimFile, false)
}

//open menu popup
async function Java_com_cburch_logisim_gui_menu_MenuFile_openFolder(lib, parent, proj) {
    try {
        const [handler] = await window.showOpenFilePicker({
            suggestedName: "",
            types: [{
                descrption: "Logisim Circuit Files",
                accept: {"application/octet-stream" : [".circ"]}
            }]
        });
        
        if (!handler) {
            console.log("No file selected.");
            return;
        }
        
        console.log("Openning file");
        const file = await handler.getFile();
        const filename = await file.name;
        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        
        // convert to Java type
        console.log("Preparing file for sending to Java");
        //const lib = await cheerpjRunLibrary("/app/logisim.jar");
        const Byte = await lib.java.lang.Byte;
        const ArrayList = await lib.java.util.ArrayList;
        
        console.log("Building byte array");
        const array = await new ArrayList();
        for (let i = 0; i < uint8Array.length; i++) {
            const b = await new Byte(uint8Array[i]);
            await array.add(b);
        }
        console.log("Converting array");
        const javaByteArray = await array.toArray();
        
        console.log("Data prepared... calling logisim method");
    
        const ProjectActions = await lib.com.cburch.logisim.proj.ProjectActions;
        const pa = await ProjectActions.doLocalOpen(parent, proj, javaByteArray, filename);
    } catch(e) {
        console.log("Error openning file: ", e);
    }
}

// load logisim file
async function Java_com_cburch_logisim_gui_menu_MenuProject_openFolder(lib, proj) {
    try {
        const [handler] = await window.showOpenFilePicker({
            suggestedName: "",
            types: [{
                descrption: "Logisim Circuit Files",
                accept: {"application/octet-stream" : [".circ"]}
            }]
        });
        
        if (!handler) {
            console.log("No file selected.");
            return;
        }
        
        console.log("Openning file");
        const file = await handler.getFile();
        const filename = await file.name;
        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        
        // convert to Java type
        console.log("Preparing file for sending to Java");
        //const lib = await cheerpjRunLibrary("/app/logisim.jar");
        const Byte = await lib.java.lang.Byte;
        const ArrayList = await lib.java.util.ArrayList;
        
        console.log("Building byte array");
        const array = await new ArrayList();
        for (let i = 0; i < uint8Array.length; i++) {
            const b = await new Byte(uint8Array[i]);
            await array.add(b);
        }
        console.log("Converting array");
        const javaByteArray = await array.toArray();
        
        console.log("Data prepared... calling logisim method");
        const ProjectLibraryActions = await lib.com.cburch.logisim.gui.menu.ProjectLibraryActions;
        const pa = await ProjectLibraryActions.doLoadLocalLogisimLibrary(proj, javaByteArray, filename);
    }
    catch(e) {
        console.log("Error openning file: ", e);
    }
}

// open Jar file

async function Java_com_cburch_logisim_gui_menu_ProjectLibraryActions_openJarLibrary(lib, proj) {
    try {
        const [handler] = await window.showOpenFilePicker({
            suggestedName: "",
            types: [{
                descrption: "Java Jar files",
                accept: {"application/octet-stream" : [".jar"]}
            }]
        });
        
        if (!handler) {
            console.log("No file selected.");
            return;
        }
        
        console.log("Openning file");
        const file = await handler.getFile();
        const filename = await file.name;
        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        
        // convert to Java type
        console.log("Preparing file for sending to Java");
        //const lib = await cheerpjRunLibrary("/app/logisim.jar");
        const Byte = await lib.java.lang.Byte;
        const ArrayList = await lib.java.util.ArrayList;
        
        console.log("Building byte array");
        const array = await new ArrayList();
        for (let i = 0; i < uint8Array.length; i++) {
            const b = await new Byte(uint8Array[i]);
            await array.add(b);
        }
        console.log("Converting array");
        const javaByteArray = await array.toArray();
        console.log("Data prepared... calling logisim method");
        const ProjectLibraryActions = await lib.com.cburch.logisim.gui.menu.ProjectLibraryActions;
        const pa = await ProjectLibraryActions.doLoadJarLibrary(proj, javaByteArray);
    }
    catch(e) {
        console.log("Error during file openning: ", e);
    }
}
