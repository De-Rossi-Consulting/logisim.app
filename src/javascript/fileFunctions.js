// Functions used by wasm to interact with local filesS

// Export Image
export async function Java_com_cburch_logisim_gui_main_ExportImage_DownloadFile(lib, filename, filedata) {
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
export async function Java_com_cburch_logisim_gui_menu_MenuFile_SendFileData(lib, data, name, logisimFile, saveAs) {
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

            const hasCirc = await hasCircularReferences(lib, logisimFile, handler)
            if (hasCirc) {
                return;
            }

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
            await logisimFile.setName(handler.name.replace(/\.circ$/, ''));
        } catch (error) {
            console.error("Failed to save file: ", error)
        }
    } else { // Save
        const db = await window.idb.openDB("fileHandlersDB", 2,);
        const handler = await db.get("handlers", fileHandlerId)

        // don't have the file id so need to save as
        // this happens as we don't have permissions from the FileSystemAPI to SAVE a file we OPEN
        if (!handler) {
            await Java_com_cburch_logisim_gui_menu_MenuFile_SendFileData(lib, data, name, logisimFile, true);
            return;
        }

        const hasCirc = await hasCircularReferences(lib, logisimFile, handler)
        if (hasCirc) {
            return;
        }

        const permissions = await handler.queryPermission({ mode: "readwrite" });

        if (permissions === "granted" || permissions === "prompt") {
            const writableStream = await handler.createWritable();
            await writableStream.write(data);
            await writableStream.close();

            console.log("File saved successfully!");
            await logisimFile.setName(handler.name.replace(/\.circ$/, ''));
        }
        else {
            console.error("Save failed: Permission denied.")
        }
    }
}

// internal function for saving the fileHandler to indexedDB
async function saveFileHandler(fileHandler, id) {
    const db = await window.idb.openDB("fileHandlersDB", 2, {
        upgrade(db) {
            if (!db.objectStoreNames.contains("handlers")) {
                db.createObjectStore("handlers")
            }
        },
    });

    await db.put("handlers", fileHandler, id);
}

// internal function for saving the fileHandler to indexedDB for libraries
async function saveLibraryHandler(fileHandler, id) {
    const db = await window.idb.openDB("fileHandlersDB", 2, {
        upgrade(db) {
            if (!db.objectStoreNames.contains("library")) {
                db.createObjectStore("library")
            }
        },
    });

    await db.put("library", fileHandler, id);
}

// save function
export async function Java_com_cburch_logisim_proj_ProjectActions_SendFileData(lib, data, name, logisimFile) {
    console.log("Saving file");
    await Java_com_cburch_logisim_gui_menu_MenuFile_SendFileData(lib, data, name, logisimFile, false)
}

//open logisim file
export async function Java_com_cburch_logisim_gui_menu_MenuFile_openFolder(lib, parent, proj) {
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
        const project = await ProjectActions.doLocalOpen(parent, proj, javaByteArray, filename);
    } catch(e) {
        console.log("Error openning file: ", e);
    }
}

// load logisim lib
export async function Java_com_cburch_logisim_gui_menu_MenuProject_openFolder(lib, proj) {
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

        let savedID = await extractFileHandlerIDFromFile(file);
        if (!savedID)
            savedID = crypto.randomUUID();
        saveLibraryHandler(handler, savedID);

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
        const pa = await ProjectLibraryActions.doLoadLocalLogisimLibrary(proj, javaByteArray, filename, savedID);
    }
    catch(e) {
        console.log("Error openning file: ", e);
    }
}

// open Jar file

export async function Java_com_cburch_logisim_gui_menu_ProjectLibraryActions_openJarLibrary(lib, proj) {
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
        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);

        //file handler id
        let savedID = await extractFileHandlerIDFromFile(file);
        if (!savedID)
            savedID = crypto.randomUUID();
        saveLibraryHandler(handler, savedID);

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
        const pa = await ProjectLibraryActions.doLoadJarLibrary(proj, javaByteArray, savedID);
    }
    catch(e) {
        console.log("Error during file openning: ", e);
    }
}

async function extractFileHandlerIDFromFile(file) {
    const xmlText = await file.text();
  
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "application/xml");
  
    const projectElement = xmlDoc.querySelector("project");
    if (!projectElement) {
        console.warn("No <project> element found in XML.");
        return null;
    }

    return projectElement.getAttribute("FileHandleId") || null;
  }

export async function Java_com_cburch_logisim_file_LibraryManager_findLocalLibrary(lib, id, loader) {
    const [uuid, name] = id.split('#');
    
    //check the db
    const db = await window.idb.openDB("fileHandlersDB", 2,);
    const handler = await db.get("library", uuid)

    let file;

    try {
    if (handler) { // we know what file this is
        file = await handler.getFile()
    }
    else { // we don't
        //show warning so its not really confusing and people know what to do
        const JOptionPane = await lib.javax.swing.JOptionPane;
        const StringUtil = await lib.com.cburch.logisim.util.StringUtil;
        const Strings = await lib.com.cburch.logisim.file.Strings;

        await JOptionPane.showMessageDialog(null,
            await StringUtil.format(await Strings.get("fileLibraryMissingError"),
            name));

        //ask user for file
        const [handler] = await window.showOpenFilePicker({
            suggestedName: "",
            types: [{
                descrption: "Logisim Circuit Files",
                accept: {"application/octet-stream" : [".circ"]}
            },{
                descrption: "Java Jar files",
                accept: {"application/octet-stream" : [".jar"]}
            }]
        });

        if (!handler) {
            console.log("No file selected.");
            return null;
        }

        console.log("Openning file");
        file = await handler.getFile();
    }

    // prep file
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    //file handler id
    let savedID = await extractFileHandlerIDFromFile(file);
    if (!savedID)
        savedID = crypto.randomUUID();

    saveLibraryHandler(handler, savedID);

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
    const ByteArrayConverter = await lib.com.wasm.helpers.ByteArrayConverter;
    const data = await ByteArrayConverter.convertObjectToByteArray(javaByteArray);
    console.log("Data prepared... calling logisim method");

    // get type from name
    if (file.name.endsWith(".jar")) {
        const LibraryManager = await lib.com.cburch.logisim.file.LibraryManager;
        const library = await LibraryManager.instance.loadJarLibrary(loader, data, name, uuid);
        return library;
    } else if (file.name.endsWith(".circ")) {
        const LibraryManager = await lib.com.cburch.logisim.file.LibraryManager;
        const library = await LibraryManager.instance.loadLogisimLibrary(loader, data, name, uuid);
        return library;
    } else {
        const parts = file.name.split('.');
        const type = parts.pop();
        const JOptionPane = await lib.javax.swing.JOptionPane;
        const StringUtil = await lib.com.cburch.logisim.util.StringUtil;
        const Strings = await lib.com.cburch.logisim.file.Strings;
        await JOptionPane.showMessageDialog(null, await StringUtil.format( await Strings.get("fileTypeError"),
            type, file.name));
        return null;
    }
    }
    catch {
        console.error("Error finding library");
        return null;
    }

}

async function hasCircularReferences(lib, file, handler) {
    const LibraryManager = await lib.com.cburch.logisim.file.LibraryManager;
    const javaIds = await LibraryManager.instance.findAllLocalReferences(file);

    // for each id - get the handler and check if it referes to the same file as the one we want to save to
    for (let i = 0; i < await javaIds.length; i++) {
        const id = await javaIds[i];
        const db = await window.idb.openDB("fileHandlersDB", 2,);
        const savedHandler = await db.get("library", id);
        if (savedHandler) {
            if (await savedHandler.isSameEntry(handler)) {
                console.log("Handlers: ", savedHandler, handler)
                const JOptionPane = await lib.javax.swing.JOptionPane;
                const StringUtil = await lib.com.cburch.logisim.util.StringUtil;
                const Strings = await lib.com.cburch.logisim.file.Strings;
                const file = await savedHandler.getFile()
                await JOptionPane.showMessageDialog(null,
					await StringUtil.format(await Strings.get("fileCircularError"), file.name),
					await Strings.get("fileSaveErrorTitle"),
					await JOptionPane.ERROR_MESSAGE);
                return true;
            }
        }
    }

    return false;
}