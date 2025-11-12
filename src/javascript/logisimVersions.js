import {Java_com_cburch_logisim_gui_main_ExportImage_DownloadFile,
    Java_com_cburch_logisim_gui_menu_MenuFile_SendFileData,
    Java_com_cburch_logisim_proj_ProjectActions_SendFileData,
    Java_com_cburch_logisim_gui_menu_MenuFile_openFolder,
    Java_com_cburch_logisim_gui_menu_MenuProject_openFolder,
    Java_com_cburch_logisim_gui_menu_ProjectLibraryActions_openJarLibrary,
    Java_com_cburch_logisim_file_LibraryManager_findLocalLibrary} from "./fileFunctions.js";
import {Java_com_cburch_logisim_gui_start_Startup_setJava} from "./exampleFunctions.js";
    
// all things related to controlling the version of logisim selected

/*
Sample Logisim version
displayName - the name displayed on the selection menu
iconPath - the icon displayed on the selection menu 
jarPath - the path to the jar file (needs the /app/ at the start for CheerpJ to find it)
natives - list of all native functions used by the java code.
{
    displayName: "",
    iconPath: "",
    jarPath: "",
    natives: {},
}
*/

export const VERSIONS = [
    {
        displayName: "Logisim",
        iconPath: "/images/logisim.ico",
        jarPath: "/app/logisims/logisim.jar",
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
    },
    {
        displayName: "logisim-evolution",
        iconPath: "",
        jarPath: "/app/logisims/logisim-evolution-4.0.0-wasm.jar",
        natives: {},
    },
];
export const SELECTED_VERSION = 1;