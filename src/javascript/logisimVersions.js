// all things related to controlling the version of logisim selected



/*
Sample Logisim version
displayName - the name displayed on the selection menu
iconPath - the icon displayed on the selection menu 
jarPath - the path to the jar file (needs the /app/ at the start for CheerpJ to find it)
{
    displayName: "",
    iconPath: "",
    jarPath: "",
}
*/

export const VERSIONS = [
    {
        displayName: "Logisim",
        iconPath: "/images/logisim.ico",
        jarPath: "/app/logisims/logisim.jar",
    },
    {
        displayName: "logisim-evolution",
        iconPath: "",
        jarPath: "/app/logisims/logisim-evolution-4.0.0-wasm.jar",
    },
];
export const SELECTED_VERSION = 1;