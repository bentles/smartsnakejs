var GA_builder = require('./ga.js');

//best results so far are from: 20 0.5 2.5 0.01
var ga = GA_builder(20, 0.5, 2.5, 0.005); //pop_size, tourn_percent, std_dev, mutate_chance
var chromo = ga.evolve(500);

var work = require("webworkify");

console.log(chromo);
ga.play_best(50);
