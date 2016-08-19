//var GA_builder = require('./ga.js');

//best results so far are from: 20 0.5 2.5 0.01
//var ga = GA_builder(20, 0.5, 2.5, 0.005); //pop_size, tourn_percent, std_dev, mutate_chance
//var chromo = ga.evolve(500);

var work = require('webworkify');
var gaWorker = work(require('./ga.js'));
var logger = require('./logger.js');

gaWorker.addEventListener('message', function (ev) {
    logger.log(ev.data);
});


//start up the ga with the following arguments
gaWorker.postMessage(
    {
        pop_size: 20,
        tourn_percent: 0.5,
        std_dev: 2.5,
        mutate_chance: 0.01,
        iter: 500
    });

//console.log(chromo);
//ga.play_best(50);
