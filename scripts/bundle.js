(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = (function() {
    var snake = {
        vision : 2,
        smell : 1,
        start_length : 3
    };

    //the composition of the network is dependant on the snake's morphology
    var ffnn = {
        num_in : snake.vision * 12 + 4 * snake.smell,
        num_hidden : 6,
        hidden_func : net => net,
        num_out : 3,
        out_func : net => net        
    };

    var ga = {
        pop_size: 20,
        tourn_percent: 0.5,
        std_dev: 2.5,
        mutate_chance: 0.01,
        iter: 5        
    };

    var game = {
        width: 15,
        height: 10
    };

    return { snake, ffnn, ga, game };
})();

},{}],2:[function(require,module,exports){
module.exports = {
    //direction consts
    N : 0,
    E : 1,
    S : 2,
    W : 3,

    //map constants
    WALL : -1,
    EMPTY : 0,

    //entity consts
    SNAKE : -2,
    APPLE : 1,
    NONE : 0,
    DEAD : 666 //used to record when a snake hits itself    
};

},{}],3:[function(require,module,exports){
var _ffnn = require('./config.js').ffnn;

function FFNN_builder() {
    var num_in = _ffnn.num_in;
    var num_hidden = _ffnn.num_hidden;
    var hidden_func = _ffnn.hidden_func;
    var num_out = _ffnn.num_out;
    var out_func = _ffnn.out_func;
    
    var inputs = [];
    var hidden_neurons = [];
    var out_neurons = [];
    var h_outputs = [];
    var outputs = [];
    var in_to_hidden = {};
    var hidden_to_out = {};
    init();

    //associate a function with each neuron
    function neuron_builder(func) {
        var neuron = {};
        neuron.func = func;

        return neuron;
    }

    function init() {
        //set up neuron lists
        //===================
        //input neurons
        var i = 0;
        var j = 0;

        for(;i < num_in; i++) {
            inputs[i] = 0;
        }
        //bias for hiddens
        inputs[i] = -1;

        //hidden neurons
        for(i = 0; i < num_hidden; i++) {
            hidden_neurons[i] = neuron_builder(hidden_func);
        }
        //bias for outputs
        hidden_neurons[i] = neuron_builder(function(){return -1;});

        //output neurons
        for(i = 0; i < num_out; i++) {
            out_neurons[i] = neuron_builder(out_func);
        }

        //set up weights as maps
        //=====================
        //in to hidden
        for(i = 0; i < inputs.length; i++) { //include bias
            for(j = 0; j < hidden_neurons.length - 1; j++) { //exclude bias
                in_to_hidden[i + "," + j] = Math.random() / 10 ; //random small weights
            }
        }
        //hidden to out
        for(i = 0; i < hidden_neurons.length; i++) { //include bias
            for(j = 0; j < out_neurons.length; j++) {
                hidden_to_out[i + "," + j] = Math.random() / 10 ; //random small weights
            }
        }
    }

    function set_weight(i, j, map, weight) {
        map[i + "," + j] = weight;
    }

    function set_all_weights(weightlist) {
        //set weights in a set order
        //sort the key lists first to get a set order

        var i2h_keys = Object.keys(in_to_hidden).sort();
        var i = 0;
        for(i = 0; i < i2h_keys.length; i++) {
            in_to_hidden[i2h_keys[i]] = weightlist[i] ;
        }

        var h2o_keys = Object.keys(hidden_to_out).sort();
        for(var j = 0; j < h2o_keys.length; j++) {
            hidden_to_out[h2o_keys[j]] = weightlist[i + j];
        }
    }

    function get_num_weights() {
        return Object.keys(in_to_hidden).length +
            Object.keys(hidden_to_out).length;
    }

    function get_weight(i,j,map) {
        return map[i + "," + j];
    }

    //takes an array of inputs
    function feed_forward(ins) {
        for(var i = 0; i < ins.length; i++) {
            inputs[i] = ins[i];
        }

        var j = 0;
        for(; j < hidden_neurons.length - 1; j++) { //excludes bias
            var net = 0;
            for(var i = 0; i < inputs.length; i++) { //includes bias
                net += inputs[i]*get_weight(i,j, in_to_hidden);
            }
            h_outputs[j] = hidden_neurons[j].func(net);
        }
        //get bias output
        h_outputs[j] = hidden_neurons[j].func();


        var j = 0;
        for(; j < out_neurons.length; j++) {
            var net = 0;
            for(var i = 0; i < h_outputs.length; i++) { //includes bias
                net += h_outputs[i]*get_weight(i,j, hidden_to_out);
            }
            outputs[j] = out_neurons[j].func(net);
        }
        return outputs;
    }

    return {set:set_all_weights, get_output:feed_forward, size:get_num_weights};
}

module.exports = FFNN_builder;

},{"./config.js":1}],4:[function(require,module,exports){
var rnorm = require('./helpers.js');

var snake_game_builder = require('./game.js');
var config = require('./config.js');
var _ga = config.ga;

module.exports = function (self) {
    self.addEventListener('message',function (ev){
        var options = ev.data;
        var ga = GA_builder();
        ga.evolve(options.iter);        
    });

    function GA_builder() {
        var pop_size =      _ga.pop_size;
        var tourn_percent = _ga.tourn_percent;
        var std_dev =       _ga.std_dev;
        var mutate_chance = _ga.mutate_chance;
        
        var game = snake_game_builder();
        var nnet = game.getNetwork();
        var chromosomes = [];
        var max_fit = -Number.MAX_VALUE;
        var max_fit_chromo = [];
        var fitnesses = [];
        var fitness_stagnation = 500;
        var fitness_stagnation_count = fitness_stagnation;

        function create_first_gen() {
            var chromosome_size = nnet.size();
            for(var i = 0; i < pop_size; i++) {
                var new_chrom = [];
                for(var j = 0; j < chromosome_size; j++) {
                    new_chrom[j] = (Math.random() - 0.5) / 2;
                }
                chromosomes[i] = new_chrom;
            }
        }

        function calc_fitnesses()
        {
            var cont = true;
            var new_max = false;

            for(var i = 0; i < chromosomes.length; i++) {
                nnet.set(chromosomes[i]);
                
                var score = 0;

                var num_runs = 5;
                for(var j = 0; j < num_runs; j++) {
                    score += game.run();
                }

                fitnesses[i] = score / num_runs;

                if (fitnesses[i] > max_fit) {
                    fitness_stagnation_count = fitness_stagnation;

                    max_fit = fitnesses[i];
                    max_fit_chromo = chromosomes[i];
                    self.postMessage({
                        message: "NEW MAX FITNESS! " + fitnesses[i],
                        chromo: max_fit_chromo.slice() //send back info for the UI
                    });
                    new_max = true;
                }
            }

            //no new max found for fitness_stagnation gens then we give up
            if (!new_max) {
                fitness_stagnation_count--;
                if (!fitness_stagnation_count)
                    cont = false;

            }

            return cont;
        }

        function tourn_select() {
            var size = Math.floor(chromosomes.length * tourn_percent);
            var selections = [];
            for(var i = 0; i < size; i++) {
                selections[i] = Math.floor(Math.random()*chromosomes.length);
            }


            var m_fit = -Number.MAX_VALUE;
            var m_fit_pos = 0;
            for(var i = 0; i < selections.length; i++) {
                if (fitnesses[selections[i]] > m_fit)
                {
                    m_fit = fitnesses[selections[i]];
                    m_fit_pos = selections[i];
                }
            }

            return m_fit_pos;
        }

        function next_gen()
        {
            var children = [];
            var cont = calc_fitnesses();

            while(children.length < chromosomes.length) {
                var p1 = tourn_select();
                var p2 = tourn_select();
                var siblings = crossover_mutate(p1, p2);
                children = children.concat(siblings);
            }
            chromosomes = children;

            return cont; //propagate signal to kill GA because it's not learning anything
        }

        function crossover_mutate(p1, p2) {
            var parent1 = chromosomes[p1];
            var parent2 = chromosomes[p2];
            var child1 = [];
            var child2 = [];

            for(var i = 0; i < parent1.length; i++) {
                var swap = Math.random() > 0.5;
                var r1 = rnorm(0, std_dev);
                var r2 = rnorm(0, std_dev);
                var mutate_c1 = Math.random() < mutate_chance ? r1 : 0;
                var mutate_c2 = Math.random() < mutate_chance ? r2 : 0;

                if (swap) {
                    child1[i] = parent2[i] + mutate_c1;
                    child2[i] = parent1[i] + mutate_c2;
                }
                else {
                    child1[i] = parent1[i] + mutate_c1;
                    child2[i] = parent2[i] + mutate_c2;
                }
            }

            return [child1, child2];
        }

        function evolve(iter) {
            var totalgens = iter;
            create_first_gen();

            while(next_gen() && iter--) {
                if (iter % 100 == 0) {
                    self.postMessage(
                        {
                            message:  "NEW GEN (" + (totalgens - iter)  + "): " + max_fit
                        });
                }
            }
            return max_fit_chromo;
        }

        function play_best(dt)
        {
            nnet.set(max_fit_chromo);
            game.play(dt);
        }

        return { evolve:evolve, play_best:play_best };
    }    
};

},{"./config.js":1,"./game.js":5,"./helpers.js":6}],5:[function(require,module,exports){
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

    var board = [];
    var snake = [];
    var apple_pos;
    var direction = consts.N;
    var score = 0;
    var lived = 0;
    var HP = _game.width * _game.height * DEATH;
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

},{"./config.js":1,"./consts.js":2,"./ffnn.js":3}],6:[function(require,module,exports){
// Generate normally-distributed random nubmers
// Algorithm adapted from:
// http://c-faq.com/lib/gaussian.html
function rnorm(mean, stdev) {
  var u1, u2, v1, v2, s;
  if (mean === undefined) {
    mean = 0.0;
  }
  if (stdev === undefined) {
    stdev = 1.0;
  }
  if (rnorm.v2 === null) {
    do {
      u1 = Math.random();
      u2 = Math.random();

      v1 = 2 * u1 - 1;
      v2 = 2 * u2 - 1;
      s = v1 * v1 + v2 * v2;
    } while (s === 0 || s >= 1);

    rnorm.v2 = v2 * Math.sqrt(-2 * Math.log(s) / s);
    return stdev * v1 * Math.sqrt(-2 * Math.log(s) / s) + mean;
  }

  v2 = rnorm.v2;
  rnorm.v2 = null;
  return stdev * v2 + mean;
}

module.exports = rnorm;

},{}],7:[function(require,module,exports){
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

},{}],8:[function(require,module,exports){
//var GA_builder = require('./ga.js');

//best results so far are from: 20 0.5 2.5 0.01
//var ga = GA_builder(20, 0.5, 2.5, 0.005); //pop_size, tourn_percent, std_dev, mutate_chance
//var chromo = ga.evolve(500);

var work = require('webworkify');
var gameBuilder = require('./game.js');
var gaWorker = work(require('./ga.js'));
var FfnnBuilder = require('./ffnn.js');
var loggerBuilder = require('./logger.js');
var logger = loggerBuilder('smartsnake-output');
var prettyPrinterBuilder = require('./prettyprint.js');
var best_chromo;

//things to use to play back the results we get
var game = gameBuilder();
var nnet = game.getNetwork();

gaWorker.addEventListener('message', function (ev) {
    logger.log(ev.data.message, function() {
        playGame(ev.data.chromo);
    });    
});

//start up the ga with the following arguments
gaWorker.postMessage(
    {
        iter: 1000
    });

//console.log(chromo);


function playGame(chromo) { 
    nnet.set(chromo);
    game.play(100, prettyPrinterBuilder());   
}



},{"./ffnn.js":3,"./ga.js":4,"./game.js":5,"./logger.js":7,"./prettyprint.js":9,"webworkify":10}],9:[function(require,module,exports){
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

},{"./consts.js":2,"./logger.js":7}],10:[function(require,module,exports){
var bundleFn = arguments[3];
var sources = arguments[4];
var cache = arguments[5];

var stringify = JSON.stringify;

module.exports = function (fn, options) {
    var wkey;
    var cacheKeys = Object.keys(cache);

    for (var i = 0, l = cacheKeys.length; i < l; i++) {
        var key = cacheKeys[i];
        var exp = cache[key].exports;
        // Using babel as a transpiler to use esmodule, the export will always
        // be an object with the default export as a property of it. To ensure
        // the existing api and babel esmodule exports are both supported we
        // check for both
        if (exp === fn || exp && exp.default === fn) {
            wkey = key;
            break;
        }
    }

    if (!wkey) {
        wkey = Math.floor(Math.pow(16, 8) * Math.random()).toString(16);
        var wcache = {};
        for (var i = 0, l = cacheKeys.length; i < l; i++) {
            var key = cacheKeys[i];
            wcache[key] = key;
        }
        sources[wkey] = [
            Function(['require','module','exports'], '(' + fn + ')(self)'),
            wcache
        ];
    }
    var skey = Math.floor(Math.pow(16, 8) * Math.random()).toString(16);

    var scache = {}; scache[wkey] = wkey;
    sources[skey] = [
        Function(['require'], (
            // try to call default if defined to also support babel esmodule
            // exports
            'var f = require(' + stringify(wkey) + ');' +
            '(f.default ? f.default : f)(self);'
        )),
        scache
    ];

    var src = '(' + bundleFn + ')({'
        + Object.keys(sources).map(function (key) {
            return stringify(key) + ':['
                + sources[key][0]
                + ',' + stringify(sources[key][1]) + ']'
            ;
        }).join(',')
        + '},{},[' + stringify(skey) + '])'
    ;

    var URL = window.URL || window.webkitURL || window.mozURL || window.msURL;

    var blob = new Blob([src], { type: 'text/javascript' });
    if (options && options.bare) { return blob; }
    var workerUrl = URL.createObjectURL(blob);
    var worker = new Worker(workerUrl);
    worker.objectURL = workerUrl;
    return worker;
};

},{}]},{},[3,4,5,6,8,7,1,2,9]);
