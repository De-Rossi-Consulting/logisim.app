function openFileChoicePopup(menu) {
    document.getElementById("btn-secondary").onclick = (ev) => { 
        closeFileChoicePopup(); 
        openCache(menu) 
    }
    document.getElementById("fileModal").style.display = "flex";
}

function closeFileChoicePopup() {
    document.getElementById("fileModal").style.display = "none";
}
