var rnorm = require('./helpers.js');
var FFNN_builder = require('./ffnn.js');
var snake_game_builder = require('./game.js');


module.exports = function (self) {
    self.addEventListener('message',function (ev){
        var options = ev.data;
        var ga = GA_builder(options.pop_size,
                            options.tourn_percent,
                            options.std_dev,
                            options.mutate_chance);
        ga.evolve(options.iter);        
    });


    function GA_builder(pop_size, tourn_percent, std_dev, mutate_chance) {
        var vision = 2;
        var nnet = FFNN_builder( /*5 * 3*/ 12 * vision + 4,
            6, function(net){return net;},
            3, function(net){return net;});
        var game = snake_game_builder(20, 10, 3, vision, nnet);
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
                    self.postMessage("NEW MAX FITNESS! " + fitnesses[i]);
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
                    self.postMessage("NEW GEN (" + (totalgens - iter)  + "): " + max_fit);
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
