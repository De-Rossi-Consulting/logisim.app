// Add an alert when the user tries to close the page to warn them that their changes might not be saved 

const cheerpContainer = document.getElementById("cheerp-container");

window.addEventListener("beforeunload", (event) => {
    event.preventDefault();
    event.returnValue = "";
})