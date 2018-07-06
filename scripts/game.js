var consts = require('./consts.js');
var config = require('./config.js');
var nnet_builder = require('./ffnn.js');

var _snake = config.snake;
var _game = config.game;

function snakeGameBuilder() {
    //timer
    var pretty_printer;
    var interval_id;

    var nnet = nnet_builder(config.ffnn);
    
    //death 0.6
    var DEATH = 0.4;

    //eyesight
    var SNAKEVISION = _snake.vision;
	
    //each time the snake gets longer increase HP by this amount
    var LENGTHHEALTHFACTOR = 1;

    var board = [];
    var snake = [];
    var apple_pos;
    var direction = consts.N;
    var score = 0;
    var lived = 0;
    var HP = _game.width * _game.height * DEATH + _snake.start_length * LENGTHHEALTHFACTOR;
    var time = 0;

    //snake can remember the last 5 things it did
    var snakemem = [];

    //a seperate map of all entities for fast checking and drawing
    var entity_map = {};

    function board_set(x, y, value) {
        board[x + y * _game.width] = value;
    }

    function board_get(x, y, value) {
        if (x < 0 || x >= _game.width || y >= _game.height || y < 0)
            return consts.WALL;
        else {
            return board[x + y * _game.width];
        }
    }

    function build_board() {
        //make some borders around the edge
        for(var i = 0; i < _game.width; i++) {
            for(var j = 0; j < _game.height; j++) {
                if (i === 0 || i === (_game.width - 1) || j === 0 || j === (_game.height - 1)) {
                    board_set(i, j, consts.WALL);
                }
                else {
                    board_set(i, j , consts.EMPTY);
                }
            }
        }
    }

    function get_id(x,y) {
        return x + y * _game.width;
    }

    //assume snake length isn't stupidly long
    function build_snake() {
        var start_pos = {x:Math.floor(_game.width/2), y:Math.floor(_game.height/2)};

        for(var i = 0; i < _snake.start_length; i++) {
            snake[i] = { x:start_pos.x, y:start_pos.y + i };
            entity_map[get_id(snake[i].x, snake[i].y)] = consts.SNAKE;
        }
    }

    function is_snake(x, y) {
        return entity_map[get_id(x,y)] === consts.SNAKE;
    }

    function get_entity(x, y) {
        return entity_map[get_id(x,y)] || consts.NONE;
    }

    //returns the blocks in lines of distance length to the left right
    //and in front of the snake
    function get_collidible_neighbours(distance) {
        distance = distance || 1;

        var forward = { x : 0, y : 0 };

        if (direction == consts.N)
            forward.y = -1;
        else if (direction == consts.S)
            forward.y = 1;
        else if (direction == consts.E)
            forward.x = 1;
        else
            forward.x = -1;

        var left = get_left(forward);
        var right = get_right(forward);

        var collidables = [];

        for(var i = 1; i <= distance; i++) {
            var fwd_pos = add(snake[0], mul(forward, i));
            var fwd_block = get_entity(fwd_pos.x, fwd_pos.y) || board_get(fwd_pos.x, fwd_pos.y);
            var left_pos = add(snake[0], mul(left, i));
            var left_block = get_entity(left_pos.x, left_pos.y) || board_get(left_pos.x, left_pos.y);
            var right_pos = add(snake[0], mul(right, i));
            var right_block = get_entity(right_pos.x, right_pos.y) || board_get(right_pos.x, right_pos.y);

            collidables.push(fwd_block);
            collidables.push(left_block);
            collidables.push(right_block);
        }
        return collidables;
    }

    function mul(a, k)
    {
        var c = {};
        c.x = a.x * k;
        c.y = a.y * k;
        return c;
    }

    function add(a, b)
    {
        var c = {};
        c.x = a.x + b.x;
        c.y = a.y + b.y;

        return c;
    }

    function get_left(forward)
    {
        var left = {};
        left.x = -forward.y;
        left.y = forward.x;
        return left;
    }

    function get_right(forward)
    {
        var right = {};
        right.x = forward.y;
        right.y = -forward.x;
        return right;
    }

    function move_grow_snake() {
        //where are we headed
        var offset = next_pos_offset();

        //add an extra snakey to where the end will be if there's an apple
        var grew = entity_map[get_id(snake[0].x + offset.x, snake[0].y + offset.y)] === consts.APPLE ;
        var old_length = snake.length;
        var tail = snake[snake.length - 1];
        if (grew) {
            HP += LENGTHHEALTHFACTOR;
            snake[old_length] = {};
            snake[old_length].x = tail.x;
            snake[old_length].y = tail.y;
        }
        else {
            //update entity map because tail has moved on
            //delete is supposed to be slow for reasons so this will do
            //the map can only ever be about as big as the board
            entity_map[get_id(tail.x, tail.y)] = undefined;
        }

        //move everything we know up one
        //dont move new part of the snake
        for(var i = old_length -1; i >= 1 ; i--) {
            snake[i].x = snake[i-1].x;
            snake[i].y = snake[i-1].y;
        }

        var head_new_x = snake[0].x + offset.x;
        var head_new_y = snake[0].y + offset.y;

        //move the head of the snake
        if (is_snake(head_new_x, head_new_y)) {
            entity_map[get_id(head_new_x, head_new_y)] = consts.DEAD;
        }
        else {
            entity_map[get_id(head_new_x, head_new_y)] = consts.SNAKE;
        }

        snake[0].x = head_new_x;
        snake[0].y = head_new_y;
        return grew;
    }

    function next_pos_offset()
    {
        var offset = {x:0, y:0};

        if (direction == consts.N)
            offset.y--;
        else if (direction == consts.S)
            offset.y++;
        else if (direction == consts.E)
            offset.x++;
        else
            offset.x--;

        return offset;
    }

    function is_dead() {
        //hit a wall
        if (board_get(snake[0].x, snake[0].y) < 0)
            return true;

        //hit self
        return get_entity(snake[0].x, snake[0].y) === consts.DEAD;
    }

    function inc_score() {
        score += 100;
        lived += (DEATH * _game.width * _game.height) - HP;
    }

    function get_input()
    {
        //this calculates the new heading
        var neighbours = get_collidible_neighbours(SNAKEVISION);

        var inputs = [];
        for(var i = 0; i < neighbours.length; i++) {
            var k = i * 4;
            //nothing
            inputs[k] = neighbours[i] == consts.NONE ? 1 : 0;
            //apple
            inputs[k + 1] = neighbours[i] == consts.APPLE ? 1 : 0;
            //wall
            inputs[k + 2] = neighbours[i] == consts.WALL ? 1 : 0;
            //self
            inputs[k + 3] = neighbours[i] == consts.SNAKE ? 1 : 0;
        }

        //inputs = inputs.concat(snakemem/*.slice(6, 15)*/);

        //console.log(inputs);

        var sx = snake[0].x;
        var sy = snake[0].y;
        var ax = apple_pos[0];
        var ay = apple_pos[1];
        var rel_apple_pos = [0,0,0,0];

        if (direction === consts.N)
            rel_apple_pos = [ ax - sx, ay - sy, 0, 0];
        else if (direction === consts.S)
            rel_apple_pos = [ ay - sy, -(ax - sx), 0, 0];
        else if (direction === consts.W)
            rel_apple_pos = [ -(ay - sy), ax - sx, 0, 0 ];
        else
            rel_apple_pos = [ -(ax - sx), -(ay - sy), 0, 0];

	if (rel_apple_pos[0] < 0)
        {
            rel_apple_pos[2] = -rel_apple_pos[0];
            rel_apple_pos[0] = 0;
        }

        if (rel_apple_pos[1] < 0)
        {
            rel_apple_pos[3] = -rel_apple_pos[1];
            rel_apple_pos[1] = 0;
        }
        inputs = inputs.concat(rel_apple_pos);
     //   inputs.push(snake.length);
      //console.log(inputs);

        var dir = nnet.get_output(inputs);
        var max = 0;
        var max_pos = 0;
        for(var i = 0; i < dir.length; i++) {
            if (dir[i] > max) {
                max = direction[i];
                max_pos = i;
            }
        }

        snakemem = snakemem.slice(3,15);
        //l
        snakemem.push(max_pos == 0 ? 1 : 0);
        //f
        snakemem.push(max_pos == 1 ? 1 : 0);
        //r
        snakemem.push(max_pos == 2 ? 1 : 0);


        return (direction + max_pos + 3) % 4;
    }

    function time_step() {
        direction = get_input();
        var grew = move_grow_snake();
        if(grew) {
            inc_score();
            apple_pos = add_apple();
            HP = _game.width * _game.height * DEATH;
        }
        HP--;
        time++;
        return HP <= 0 ? true : is_dead();
    }

  

    //will probably break if snake is massive, will have to reimplement then
    function add_apple() {
        var size = _game.width*_game.height;

        while(true) {
            var pos = Math.floor(Math.random()*size);
            var x = pos % _game.width;
            var y = Math.floor(pos / _game.width);
            if (!is_snake(x, y) && (board_get(x, y) === consts.EMPTY)) {
                entity_map[pos] = consts.APPLE;
                break; //stop trying - found a valid spot for an apple
            }
        }

        return [x,y];
    }

    function game() {
        var done = !game_loop();
        pretty_printer.prettyPrint(_game.height, _game.width, board_get, get_entity, score);
        //stop game if snake dies
        if (done) {
        clearInterval(interval_id);
            pretty_printer.gameOver();
        }
    }

    function game_loop() {
        var end = time_step();
        return !end;
    }

    function play(milliseconds, pretty) {
        if (interval_id)
            stop();
        
        
        pretty_printer = pretty;
        init();
        interval_id = setInterval(game, milliseconds);
    }

    function stop() {
        clearInterval(interval_id);
    }

    function run()
    {      
        init();
        while(game_loop()){}
        return score; ///time; //+ time; //time is constrained
    }

    function init()
    {
        board = [];
        snake = [];
        direction = consts.N;
        score = 0;
        lived = 0;
        HP = _game.width * _game.height * DEATH;
        time = 0;
        entity_map = {};
        snakemem = [0,1,0,0,1,0,0,1,0,0,1,0,0,1,0];

        //set up actual game (finally sheesh)
        build_board();
        build_snake();
        apple_pos = add_apple();
    }

    function getNetwork() {
        return nnet;
    }

    return { play, run, getNetwork } ;
}

module.exports = snakeGameBuilder;
