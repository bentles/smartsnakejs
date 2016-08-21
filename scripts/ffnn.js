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
