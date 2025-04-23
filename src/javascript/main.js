import {Java_com_cburch_logisim_gui_main_ExportImage_DownloadFile,
        Java_com_cburch_logisim_gui_menu_MenuFile_SendFileData,
        Java_com_cburch_logisim_proj_ProjectActions_SendFileData,
        Java_com_cburch_logisim_gui_menu_MenuFile_openFolder,
        Java_com_cburch_logisim_gui_menu_MenuProject_openFolder,
        Java_com_cburch_logisim_gui_menu_ProjectLibraryActions_openJarLibrary,
        Java_com_cburch_logisim_file_LibraryManager_findLocalLibrary} from "./fileFunctions.js";

import {Java_com_cburch_logisim_gui_start_Startup_setJava, loadExample} from "./exampleFunctions.js";
import "./closeAlert.js";

window.idb = idb;
window.loadExample = loadExample;

(async function () {
    await cheerpjInit({
        version: 8,
        natives: {
            Java_com_cburch_logisim_gui_main_ExportImage_DownloadFile,
            Java_com_cburch_logisim_gui_menu_MenuFile_SendFileData,
            Java_com_cburch_logisim_proj_ProjectActions_SendFileData,
            Java_com_cburch_logisim_gui_menu_MenuFile_openFolder,
            Java_com_cburch_logisim_gui_menu_MenuProject_openFolder,
            Java_com_cburch_logisim_gui_menu_ProjectLibraryActions_openJarLibrary,
            Java_com_cburch_logisim_gui_start_Startup_setJava,
            Java_com_cburch_logisim_file_LibraryManager_findLocalLibrary,
        },
    });
    cheerpjCreateDisplay(
        -1,
        -1,
        document.getElementById("cheerp-container"),
    );
    while (true)
        // restarts the app if its fully closed
        await cheerpjRunJar("/app/logisim.jar");
})();

(async function () {
    const db = await window.idb.openDB("fileHandlersDB", 2, {
        upgrade(db) {
            if (!db.objectStoreNames.contains("handlers")) {
                db.createObjectStore("handlers");
            }
            if (!db.objectStoreNames.contains("library")) {
                db.createObjectStore("library");
            }
        }
    });
})();

