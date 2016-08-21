function logger(id, isHTML) {
    var outputElem = document.getElementById(id);

    return {
        log : function(message, onclick) {
            if (isHTML) {
                outputElem.insertAdjacentHTML('beforeend', message);
                return;
            }
            
            var elem = document.createElement('p');
            elem.id = 'smartsnake-message';
            elem.innerHTML = message;
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
