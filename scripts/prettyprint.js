var consts = require('./consts.js');
var logger = require('./logger.js')('smartsnake-gameplay');

module.exports = function createPrettyPrinter() {
    var map_tokens = {};
    var entity_tokens = {};
    map_tokens[consts.EMPTY] =".";
    map_tokens[consts.WALL] = "W";

    entity_tokens[consts.SNAKE] ="S";
    entity_tokens[consts.APPLE] ="A";
    entity_tokens[consts.DEAD] ="X";


    function prettyPrint(height, width, board_get, get_entity, score)
    {
        clear();
        for(var j = 0; j < height; j++) {
            var line = "";
            for(var i = 0; i < width; i++) {
                var char = map_tokens[board_get(i,j)];
                if (get_entity(i,j) !== consts.NONE ) {
                    char = entity_tokens[get_entity(i,j)];
                }
                line += char;
            }
            logger.log(line);
        }
        logger.log('SCORE: ' + score);
    }

    function clear() {
        logger.clear();
    }

    function gameOver() {
        logger.log('GAME OVER');
    }

    return { prettyPrint, clear, gameOver };
};
