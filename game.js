function snake_game_builder(width, height, start_length, vision, nnet) {
    //direction consts
    var N = 0;
    var E = 1;
    var S = 2;
    var W = 3;

    //map constants
    var WALL = -1;
    var EMPTY = 0;

    //entity consts
    var SNAKE = -2;
    var APPLE = 1;
    var NONE = 0;
    var DEAD = 666; //used to record when a snake hits itself

    //timer
    var interval_id;

    //death 0.6
    var DEATH = 0.55;

    //eyesight
    var SNAKEVISION = vision;

    var map_tokens = {};
    map_tokens[EMPTY] =".";
    map_tokens[WALL] = "W";

    var entity_tokens = {};
    entity_tokens[SNAKE] ="S";
    entity_tokens[APPLE] ="A";
    entity_tokens[DEAD] ="X";

    var board = [];
    var snake = [];
    var apple_pos ;
    var direction = N;
    var score = 0;
    var lived = 0;
    var HP = width*height*DEATH;
    var time = 0;

    //snake can remember the last 5 things it did
    var snakemem = [];

    //a seperate map of all entities for fast checking and drawing
    var entity_map = {};

    function board_set(x, y, value) {
        board[x + y*width] = value;
    }

    function board_get(x, y, value) {
        if (x < 0 || x >= width || y >= height || y < 0)
            return WALL;
        else {
            return board[x + y*width];
        }
    }

    function build_board() {
        //make some borders around the edge
        for(var i = 0; i < width; i++) {
            for(var j = 0; j < height; j++) {
                if (i === 0 || i === (width - 1) || j === 0 || j === (height - 1)) {
                    board_set(i, j, WALL);
                }
                else {
                    board_set(i, j , EMPTY);
                }
            }
        }
    }

    function get_id(x,y) {
        return x + y*width;
    }

    //assume snake length isn't stupidly long
    function build_snake() {
        var start_pos = {x:Math.floor(width/2), y:Math.floor(height/2)};

        for(var i = 0; i < start_length; i++) {
            snake[i] = {x:start_pos.x,y:start_pos.y + i};
            entity_map[get_id(snake[i].x, snake[i].y)] = SNAKE;
        }
    }

    function is_snake(x, y) {
        return entity_map[get_id(x,y)] === SNAKE;
    }

    function get_entity(x, y) {
        return entity_map[get_id(x,y)] || NONE;
    }

    //returns the blocks in lines of distance length to the left right
    //and in front of the snake
    function get_collidible_neighbours(distance) {
        distance = distance || 1;

        var forward = {x:0, y:0};

        if (direction == N)
            forward.y = -1;
        else if (direction == S)
            forward.y = 1;
        else if (direction == E)
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

	//console.log(collidables);
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
        var grew = entity_map[get_id(snake[0].x + offset.x, snake[0].y + offset.y)] === APPLE ;
        var old_length = snake.length;
        var tail = snake[snake.length - 1];
        if (grew) {
            var length =
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
            entity_map[get_id(head_new_x, head_new_y)] = DEAD;
        }
        else {
            entity_map[get_id(head_new_x, head_new_y)] = SNAKE;
        }

        snake[0].x = head_new_x;
        snake[0].y = head_new_y;
        return grew;
    }

    function next_pos_offset()
    {
        var offset = {x:0, y:0};

        if (direction == N)
            offset.y--;
        else if (direction == S)
            offset.y++;
        else if (direction == E)
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
        return get_entity(snake[0].x, snake[0].y) === DEAD;
    }

    function inc_score() {
        score += 100;
        lived += (DEATH * width * height) - HP;
    }

    function get_input()
    {
        //this calculates the new heading
        var neighbours = get_collidible_neighbours(SNAKEVISION);

        var inputs = [];
        for(var i = 0; i < neighbours.length; i++) {
            var k = i * 4;
            //nothing
            inputs[k] = neighbours[i] == NONE ? 1 : 0;
            //apple
            inputs[k + 1] = neighbours[i] == APPLE ? 1 : 0;
            //wall
            inputs[k + 2] = neighbours[i] == WALL ? 1 : 0;
            //self
            inputs[k + 3] = neighbours[i] == SNAKE ? 1 : 0;
        }

        //inputs = inputs.concat(snakemem/*.slice(6, 15)*/);

        //console.log(inputs);

        var sx = snake[0].x;
        var sy = snake[0].y;
        var ax = apple_pos[0];
        var ay = apple_pos[1];
        var rel_apple_pos = [0,0,0,0];

        if (direction === N)
            rel_apple_pos = [ ax - sx, ay - sy, 0, 0];
        else if (direction === S)
            rel_apple_pos = [ ay - sy, -(ax - sx), 0, 0];
        else if (direction === W)
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
            HP = width * height * DEATH;
        }
        HP--;
        time++;
        return HP <= 0 ? true : is_dead();
    }

    function pretty_print()
    {
        clear();
        for(var j = 0; j < height; j++) {
            var line = "";
            for(var i = 0; i < width; i++) {
                var char = map_tokens[board_get(i,j)];
                if (get_entity(i,j) !== NONE ) {
                    char = entity_tokens[get_entity(i,j)];
                }
                line += char;
            }
            console.log(line);
        }
        console.log("SCORE: " + score);
        console.log(snakemem);
    }

    function clear() {
        process.stdout.write('\u001B[2J\u001B[0;0f');
    }

    //will probably break if snake is massive, will have to reimplement then
    function add_apple() {
        var size = width*height;

        while(true) {
            var pos = Math.floor(Math.random()*size);
            var x = pos % width;
            var y = Math.floor(pos / width);
            if (!is_snake(x, y) && (board_get(x, y) === EMPTY)) {
                entity_map[pos] = APPLE;
                break; //stop trying - found a valid spot for an apple
            }
        }

        return [x,y];
    }

    function game() {
        var done = !game_loop();
        pretty_print();
        //stop game if snake dies
        if (done) {
        clearInterval(interval_id);
            console.log('GAME OVER');
        }
    }

    function game_loop() {
        var end = time_step();
        return !end;
    }

    function play(milliseconds) {
        init();
        interval_id = setInterval(game, milliseconds);
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
        direction = N;
        score = 0;
        lived = 0;
        HP = width*height*DEATH;
        time = 0;
        entity_map = {};
        snakemem = [0,1,0,0,1,0,0,1,0,0,1,0,0,1,0];

        //set up actual game (finally sheesh)
        build_board();
        build_snake();
        apple_pos = add_apple();
    }

    return {play:play, run:run} ;
}

module.exports = snake_game_builder;
