function logger() {
    var outputElem = document.getElementById("smartsnake-output");

    return {
        log : function(message) {
            outputElem.
                insertAdjacentHTML("beforeend", `<p id="smartsnake-message">${message}</p>`);
        },
        clear : function() {
            while (outputElem.firstChild) {
                outputElem.removeChild(outputElem.firstChild);
            }
        }
    };
}

module.exports = logger();
