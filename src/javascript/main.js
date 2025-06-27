import {loadExample} from "./exampleFunctions.js";
import {VERSIONS, SELECTED_VERSION} from "./logisimVersions.js"
import "./closeAlert.js";

window.idb = idb;
window.loadExample = loadExample;

(async function () {
    await cheerpjInit({
        version: 8,
        natives: Object.fromEntries(VERSIONS.flatMap(version => Object.entries(version.natives)))
    });
    cheerpjCreateDisplay(
        -1,
        -1,
        document.getElementById("cheerp-container"),
    );
    while (true)
        // restarts the app if its fully closed
        await cheerpjRunJar(VERSIONS[SELECTED_VERSION].jarPath);
})();

// need to migrate to a new DB
(async function () {
    const oldDbName = "fileHandlersDB";
    const newDbName = "fileHandlesDB";

    // Utility to check if an old DB exists (hacky but works)
    const oldDbExists = await new Promise((resolve) => {
        const req = indexedDB.open(oldDbName);
        let existed = true;
        req.onupgradeneeded = () => {
            existed = false; // newly created → doesn't exist
        };
        req.onsuccess = () => {
            req.result.close();
            if (!existed) {
                indexedDB.deleteDatabase(oldDbName);
            }
            resolve(existed);
        };
        req.onerror = () => resolve(false);
    });

    if (oldDbExists) {
        const oldDb = await window.idb.openDB(oldDbName);
        const newDb = await window.idb.openDB(newDbName, 1, {
            upgrade(db) {
                if (!db.objectStoreNames.contains("files")) {
                    db.createObjectStore("files");
                }
                if (!db.objectStoreNames.contains("libraries")) {
                    db.createObjectStore("libraries");
                }
            }
        });

        // Copy over each store if it exists
        const migrateStore = async (source, target) => {
            if (!oldDb.objectStoreNames.contains(source)) return;

            // read old data
            const txOld = oldDb.transaction(source, 'readonly');
            const storeOld = txOld.objectStore(source);
            const keys = await storeOld.getAllKeys();
            const values = await Promise.all(keys.map(key => storeOld.get(key)));
            await txOld.done;

            // write old data
            const txNew = newDb.transaction(target, 'readwrite');
            const storeNew = txNew.objectStore(target);
            for (let i = 0; i < keys.length; i++) {
                storeNew.put(values[i], keys[i]);
            }
            await txNew.done;
        };

        await migrateStore("handlers", "files");
        await migrateStore("library", "libraries");

        oldDb.close();
        await indexedDB.deleteDatabase(oldDbName);
        console.log("Migration from fileHandlersDB to fileHandlesDB completed.");
    } else {
        // If no old DB, just open the new one
        await window.idb.openDB(newDbName, 1, {
            upgrade(db) {
                if (!db.objectStoreNames.contains("files")) {
                    db.createObjectStore("files");
                }
                if (!db.objectStoreNames.contains("libraries")) {
                    db.createObjectStore("libraries");
                }
            }
        });
        console.log("fileHandlesDB initialized (no migration needed).");
    }
})();

