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
        iter: 10000
    });

//console.log(chromo);


function playGame(chromo) { 
    nnet.set(chromo);
    game.play(100, prettyPrinterBuilder());   
}


