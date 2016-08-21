var consts = require('./consts.js');
var logger = require('./logger.js')('smartsnake-gameplay', true);

module.exports = function createPrettyPrinter() {
    var map_tokens = {};
    var entity_tokens = {};
    map_tokens[consts.EMPTY] ='<div class="smartsnake-square" id="dot"></div>';
    map_tokens[consts.WALL] = '<div class="smartsnake-square" id="W"></div>';

    entity_tokens[consts.SNAKE] ='<div class="smartsnake-square" id="S"></div>';
    entity_tokens[consts.APPLE] ='<div class="smartsnake-square" id="A"></div>';
    entity_tokens[consts.DEAD] ='<div class="smartsnake-square" id="X"></div>';


    function prettyPrint(height, width, board_get, get_entity, score)
    {
        clear();
        for(var j = 0; j < height; j++) {
            var line = '<div class="smartsnake-row">';
            for(var i = 0; i < width; i++) {
                var char = map_tokens[board_get(i,j)];
                if (get_entity(i,j) !== consts.NONE ) {
                    char = entity_tokens[get_entity(i,j)];
                }
                line += char;
            }
            line += '</div>';
            logger.log(line);
        }
        logger.log('SCORE: ' + score);
    }

    function clear() {
        logger.clear();
    }

    function gameOver() {
        logger.log('<br /> GAME OVER');
    }

    return { prettyPrint, clear, gameOver };
};
