function openFileChoicePopup(menu) {
    document.getElementById("btn-secondary").onclick = async(ev) => { 
        closeFileChoicePopup(); 
        await menu.cacheOpen(); 
    }
    document.getElementById("fileModal").style.display = "flex";
}

function closeFileChoicePopup() {
    document.getElementById("fileModal").style.display = "none";
}
