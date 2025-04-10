// Functions used to load examples

async function Java_com_cburch_logisim_gui_start_Startup_setJava(lib) {
    window.JavaInstance = await lib;
    window.ProjectActions = await lib.com.cburch.logisim.proj.ProjectActions;
    console.log("Java instance set on JavaScript side");
    return new Promise(() => {}); // allows continued access
}

async function loadExample(examplePath, exampleName) {
    if (!window.JavaInstance) {
        window.alert("Please wait for Logisim to launch");
        return;
    }

    document.querySelectorAll("details").forEach((details) => {
      details.open = false
    })

    try{
        const response = await fetch(examplePath);
        const filename = exampleName;

        // read the file data in
        const reader = await response.body.getReader();
        let chunks = [];
        let totalLength = 0;

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
            totalLength += value.length;
        }

        // Concatenate all chunks into a single Uint8Array
        const result = new Uint8Array(totalLength);
        let offset = 0;
        for (let chunk of chunks) {
            result.set(chunk, offset);
            offset += chunk.length;
        }
        const uint8Array = result;

        // convert to Java type
        console.log("Preparing file for sending to Java");
        const Byte = await window.JavaInstance.java.lang.Byte;
        const ArrayList = await window.JavaInstance.java.util.ArrayList;

        console.log("Building byte array");
        const array = await new ArrayList();
        for (let i = 0; i < uint8Array.length; i++) {
            const b = await new Byte(uint8Array[i]);
            await array.add(b);
        }
        console.log("Converting array");
        const javaByteArray = await array.toArray();

        console.log("Data prepared... calling logisim method");

        const pa = await window.ProjectActions.doLocalOpen(null, null, javaByteArray, filename);
        toggleDropdown()
    } catch (e) {
        console.error("Error occured loading example: ", e);
    }
}
