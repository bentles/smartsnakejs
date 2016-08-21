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
