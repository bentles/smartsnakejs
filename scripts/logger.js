function logger(id) {
    var outputElem = document.getElementById(id);

    return {
        log : function(message, onclick) {
            var elem = document.createElement('p');
            elem.id = 'smartsnake-message';
            elem.textContent = message;
            if (onclick){
                elem.style.cursor = 'pointer';
                elem.onclick = onclick;                
            }

            outputElem.appendChild(elem);
        },
        clear : function() {
            while (outputElem.firstChild) {
                outputElem.removeChild(outputElem.firstChild);
            }
        }
    };
}

module.exports = logger;
