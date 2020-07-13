import * as Layers from '@/lib/layers.js';

function loadFromProto(modelProto) {

    // console.log(modelProto);
    
    var output_map = {};

    var weights = {};
    for (let initializer of modelProto.graph.initializer) {
        weights[initializer.name] = new Layers.Weight(initializer);
    }
    console.log(weights);
    const weight_names = Object.keys(weights);

    
    for (let input of modelProto.graph.input) {
        // check if the input is already in weights
        if (weight_names.includes(input.name)) continue;

        // Add as a layer
        var input_layer = new Layers.Input(input);
        output_map[input_layer.name] = input_layer;
    }

    var layers = [];
    for (let node of modelProto.graph.node) {
        var layer = Layers.parseNodeProto(node, weights);
        for (let output_name of node.output) {
            output_map[output_name] = layer;
        }
        layers.push(layer);
    }

    for (let layer of layers) {
        for (let input of layer.node.input) {
            if (weight_names.includes(input)) {
                layer.inputs[input] = weights[input];
            } else {
                layer.inputs[input] = output_map[input];
            }
        }
    }

    var output_layers = [];
    for (let output of modelProto.graph.output) {
        var output_layer = new Layers.Output(output);
        output_layer.inputs[output_layer.name] = output_map[output_layer.name];
        output_layer.compute();
        output_layers.push(output_layer);
    }

    var ops = 0;
    for (let layer in output_map) {
        ops += output_map[layer].ops;
    }

    for (let name in output_map) {
        console.log(name, output_map[name]);
    }

    weights = null;
    layers = null;

    return {
        name: modelProto.graph.name,
        //layers: output_map,
        totalOps: ops,
    };
}


export default {loadFromProto};