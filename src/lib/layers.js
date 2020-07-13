const Int64LE = require("int64-buffer").Int64LE;

class Layer {
    name = '';
    inputs = {};
    outputs = {};
    params = {};

    node = null;
    ops = 0;
    computed = false;

    constructor(node) {
        this.node = node;
        this.name = node.name;
        
        if (node.input) {
            for (let input_name of node.input) {
                this.inputs[input_name] = null;
            }
        }   
    }

    compute() {
        // make sure all the inputs are computed;
        // if not compute them first;
        for (let input in this.inputs) {
            if (this.inputs[input].computed === false) {
                this.inputs[input].compute();
            }
        }

        this.calculateOutputDim();
        this.calculateOps();
        this.computed = true;
    }

    calculateOutputDim() {
        return;
    }

    calculateOps() {
        this.ops = 0;
        return;
    }

    dim2array(dim) {
        return dim.map(x => x.dimValue);
    }
}

function parseNodeProto(node) {
    switch (node.opType) {
        case "Conv":
            return new Conv(node);
        case "BatchNormalization":
            return new BatchNorm(node);
        case "Relu":
            return new Relu(node);
        case "MaxPool":
            return new MaxPool(node);
        case "Add":
            return new Add(node);
        case "AveragePool":
            return new AvgPool(node);
        case "GlobalAveragePool":
            return new AvgPool(node, true);
        case "Flatten":
            return new Flatten(node);
        case "Reshape":
            return new Reshape(node);
        case "Gemm":
            return new GeMM(node);
        case "ReduceMean":
            return new ReduceMean(node);
        case "Squeeze":
            return new Squeeze(node);
        case "Identity":
            return new Identity(node);
        case "MatMul":
            return new MatMul(node);
        case "ArgMax":
            return new ArgMax(node);
        case "Softmax":
            return new Softmax(node);
        case "Clip":
            return new Clip(node);
        case "Cast":
            return new Cast(node);
        case "Shape":
            return new Shape(node);
        default:
            console.log(node);
            console.log("Not Implemented for " + node.opType);
            return new Layer(node);
    }
}

class Input extends Layer {

    constructor(node) {
        super(node);
        this.inputs = {};
        this.outputs[this.name] = this.dim2array(node.type.tensorType.shape.dim);
        if (this.outputs[this.name][0] == 0)
            this.outputs[this.name][0] = 1;
        this.computed = true;
    }

}

class Weight {
    initializer;
    outputs = {};
    computed = true;

    constructor(initializer) {
        this.initializer = initializer;
        this.outputs[initializer.name] = initializer.dims;
    }
}

class Output extends Layer {

    constructor(node) {
        super(node);
        this.outputs = null;
    }

}

class Identity extends Layer {

    constructor(node) {
        super(node);
    }

    calculateOutputDim() {
        this.outputs[this.node.output[0]] = this.inputs[this.node.input[0]].outputs[this.node.input[0]];
    }
}

class Cast extends Identity {

    initializer = null;
    value = null;

    constructor(node) {
        super(node);
    }

    calculateOutputDim() {
        this.outputs[this.node.output[0]] = this.inputs[this.node.input[0]].outputs[this.node.input[0]];

        if (this.inputs[this.node.input[0]].initializer)
            this.initializer = this.inputs[this.node.input[0]].initializer;
        if (this.inputs[this.node.input[0]].value)
            this.value = this.inputs[this.node.input[0]].value;
    }
}

class Conv extends Layer {

    in_channels;
    auto_pad;
    kernel_shape;
    padding;
    stride;
    dilation;
    groups; 
    bias;

    constructor(node) {
        super(node);
    }

    calculateOutputDim() {
        var [input_name, weight_name, bias_name] = this.node.input;
        
        var input_dim = this.inputs[input_name].outputs[input_name];
        this.in_channels = input_dim[1];

        this.kernel_shape = this.inputs[weight_name].outputs[weight_name].slice(2,);
        if (bias_name) this.bias = true;
        else this.bias = false;

        this.parseAttributes(input_dim);

        var output_dim = [input_dim[0], this.inputs[weight_name].outputs[weight_name][0]];
        for (let i = 2; i < input_dim.length; i+= 1) {
            var dim = input_dim[i] + this.padding[i-2] - this.dilation[i-2] * (this.kernel_shape[i-2] - 1) - 1;
            dim = dim / this.stride[i-2];
            dim += 1;
            output_dim.push(Math.floor(dim));
        }

        this.outputs[this.node.output[0]] = output_dim;
    }

    parseAttributes(input_dim) {
        this.auto_pad = 'NOTSET';
        this.dilation = Array(input_dim.length - 2).fill(1);
        this.padding = Array(input_dim.length - 2).fill(0);
        this.stride = Array(input_dim.length - 2).fill(1);
        this.groups = 1;

        for (let attribute of this.node.attribute) {
            switch (attribute.name) {
                case "dilations":
                    this.dilation = attribute.ints;
                    break;
                case "group":
                    this.groups = attribute.i;
                    break;
                case "pads":
                    var padding = [];
                    for (let i = 0; i < attribute.ints.length / 2; i += 1)
                        padding.push(attribute.ints[i] + attribute.ints[i + attribute.ints.length/2]);
                    this.padding = padding;
                    break;
                case "strides":
                    this.stride = attribute.ints;
                    break;
                case "auto_pad":
                    this.auto_pad = attribute.s;
                    break;
            }
        }

        if (this.auto_pad === "SAME_UPPER" || this.auto_pad === "SAME_LOWER") {
            var input_spatial_dim = input_dim.slice(2,);
            for (let i = 0; i < input_spatial_dim.length; i += 1) {
                this.padding[i] = (input_spatial_dim[i] * (this.stride[i] - 1) + (this.dilation[i]*(this.kernel_shape[i] - 1)));
                this.padding[i] += 1 - this.stride[i];
                this.padding[i] /= 2;
            }
        }
    }

    calculateOps() {
        var ops_per_output = 2 * ((this.in_channels / this.groups) * this.kernel_shape.reduce((a, b) => a*b)) - 1;
        if (this.bias) ops_per_output += 1;
        this.ops = this.outputs[this.node.output[0]].reduce((a, b) => a*b) * ops_per_output;
    }
}

class Shape extends Layer {

    value;

    constructor(node) {
        super(node);
    }

    calculateOutputDim() {
        var [input_name,] = this.node.input;
        var input_dim = this.inputs[input_name].outputs[input_name];

        this.value = input_dim;
        this.outputs[this.node.output[0]] = [input_dim.length,];
    }
}

class Reduce extends Layer {
    
    axes = null;
    keepdims = 1;

    constructor(node) {
        super(node);
    }

    calculateOutputDim() {
        var [input_name,] = this.node.input;
        var input_dim = this.inputs[input_name].outputs[input_name];
        this.parseAttributes();
        
        if (this.axes === null)
            this.axes = [...Array(input_dim.length).keys()];

        for (let i = 0; i < input_dim.length; i++) {
            if (this.axes[i] < 0) {
                this.axes[i] = input_dim.length + this.axes[i];
            }
        }

        var output_dim = [];
        for (let i = 0; i < input_dim.length; i++) {
            if (this.axes.includes(i)) {
                if(this.keepdims)
                    output_dim.push(1);
            }
            else {
                output_dim.push(input_dim[i]);
            }

        }
        
        this.outputs[this.node.output[0]] = output_dim;
    }

    parseAttributes() {
        for (let attribute of this.node.attribute) {
            switch (attribute.name) {
                case "axes":
                    this.axes = attribute.ints;
                    break;
                case "keepdims":
                    this.keepdims = attribute.i;
                    break;
            }
        }
    }
}

class ReduceMean extends Reduce {

    constructor(node) {
        super(node);
    }

    calculateOps() {
        var [input_name,] = this.node.input;
        var input_dim = this.inputs[input_name].outputs[input_name];

        var ops_per_output = 0;
        for (var idx of this.axes) {
            ops_per_output += input_dim[idx];
        }

        this.ops = this.outputs[this.node.output[0]].reduce((a, b) => a*b) * ops_per_output;
    }
}

class Squeeze extends Layer {

    axes = null;

    constructor(node) {
        super(node)
    }

    calculateOutputDim() {
        var [input_name,] = this.node.input;
        var input_dim = this.inputs[input_name].outputs[input_name];
        this.parseAttributes();

        if (this.axes === null)
            this.axes = [...Array(input_dim.length).keys()];

        for (var i = 0; i < input_dim.length; i++) {
            if (this.axes[i] < 0) {
                this.axes[i] = input_dim.length + this.axes[i];
            }
        }

        var output_dim = [];
        for (let i = 0; i < input_dim.length; i++) {
            if (this.axes.includes(i) && input_dim[i] === 1)
                continue;        
            output_dim.push(input_dim[i]);
        }

        this.outputs[this.node.output[0]] = output_dim;
    }

    parseAttributes() {
        for (let attribute of this.node.attribute) {
            switch (attribute.name) {
                case "axes":
                    this.axes = attribute.ints;
                    break;
            }
        }
    }
}

class GeMM extends Layer {

    alpha = 1;
    beta = 1;
    hasC = false;
    transA = 0;
    transB = 0;
    K;

    constructor(node) {
        super(node);
    }

    calculateOutputDim() {
        this.parseAttributes();

        var [matA_name, matB_name, matC_name] = this.node.input;
        var matA_shape = this.inputs[matA_name].outputs[matA_name];
        var matB_shape = this.inputs[matB_name].outputs[matB_name];

        if (matC_name) this.hasC = true;

        var output_dim = [matA_shape[this.transA], matB_shape[1 - this.transB]];
        this.outputs[this.node.output[0]] = output_dim;
        this.K = matA_shape[1 - this.transA];
    }

    parseAttributes() {
        for (let attribute of this.node.attribute) {
            switch (attribute.name) {
                case "transA":
                    this.transA = attribute.i;
                    break;
                case "transB":
                    this.transB = attribute.i;
                    break;
                case "alpha":
                    this.alpha = attribute.i;
                    break;
                case "beta":
                    this.beta = attribute.i;
            }
        }
    }

    calculateOps() {
        var ops_per_output = 2 * this.K - 1;   
        if (this.alpha !== 1) ops_per_output += 1;
        if (this.hasC && this.beta !== 0) ops_per_output += 2;
        this.ops = ops_per_output * this.outputs[this.node.output[0]].reduce((a, b) => a*b);
    }
}

class MatMul extends GeMM {
    constructor(node) { super(node); }
}

class Clip extends Identity {

    min = null;
    max = null;

    constructor(node) {
        super(node);
    }

    calculateOps() {
        this.parseAttributes();
        var [input_name, min, max] = this.node.input;
        var input_dim = this.inputs[input_name].outputs[input_name];
        var local_ops = input_dim.reduce((a, b) => a*b);
        if (min || this.min) this.ops += local_ops;
        if (max || this.max) this.ops += local_ops; 
    }

    parseAttributes() {
        for (let attribute of this.node.attribute) {
            switch (attribute.name) {
                case "min":
                    this.min = attribute.f;
                    break;
                case "max":
                    this.max = attribute.f;
                    break;
            }
        }
    }
}


class BatchNorm extends Identity {

    constructor(node) {
        super(node);
    }

    calculateOps() {
        var input_dim = this.inputs[this.node.input[0]].outputs[this.node.input[0]];
        this.ops = input_dim.reduce((a, b) => a*b) * 2;
    }
}

class Activation extends Identity {
    // pass through activation

    constructor(node) {
        super(node);
    }

    calculateOps() {
        var input_dim = this.inputs[this.node.input[0]].outputs[this.node.input[0]];
        this.ops = input_dim.reduce((a, b) => a*b);
    }
}

class Relu extends Activation {

    constructor(node) {
        super(node);
    }

}

class Softmax extends Activation {

    axis = 1;

    constructor(node) {
        super(node);
    }

    parseAttributes() {
        for (let attribute of this.node.attribute) {
            switch (attribute.name) {
                case "axis":
                    this.axis = attribute.i;
            }
        }
    }

    calculateOps() {
        var D = 1;
        var input_dim = this.inputs[this.node.input[0]].outputs[this.node.input[0]];

        if (this.axis < 0)
            this.axis = input_dim.length + this.axis;

        for (let i = this.axis; i < input_dim.length; i+=1) D *= input_dim[i];

        this.ops = 2 * D + (D - 1); // 2 per element + summation
    }
}

class Add extends Identity {

    constructor(node) {
        super(node);
    }

    calculateOps() {
        var input_dim = this.inputs[this.node.input[0]].outputs[this.node.input[0]];
        this.ops = input_dim.reduce((a, b) => a*b);
    }
}

class Pool extends Layer {

    auto_pad;
    ceil_mode;
    kernel_shape;
    padding;
    stride;
    dilation;
    global;

    constructor(node, global) {
        super(node);
        this.global = global;
    }

    calculateOutputDim() {
        var [input_name,] = this.node.input;
        var input_dim = this.inputs[input_name].outputs[input_name];

        this.parseAttributes(input_dim);

        var output_dim = [input_dim[0], input_dim[1]];
        var dim = 0;
        if (this.global) {
            for (let i = 2; i < input_dim.length; i += 1) output_dim.push(1);
        } else {
            if (this.auto_pad === "NOTSET") {
                for (let i = 2; i < input_dim.length; i += 1) {
                    dim = input_dim[i] + this.padding[i-2] - ((this.kernel_shape[i-2] - 1) * this.dilation[i-2] + 1);
                    dim = dim / this.stride[i-2];
                    dim += 1;
                    if (this.ceil_mode === 1)
                        dim = Math.ceil(dim);
                    else
                        dim = Math.floor(dim);
                    output_dim.push(dim);
                }
            } else if (this.auto_pad === "VALID") {
                for (let i = 2; i < input_dim.length; i+=1) {
                    dim = Math.ceil((input_dim[i] - ((this.kernel_shape[i-2] - 1) * this.dilation[i-2] + 1) + 1) / this.stride[i-2]);
                    output_dim.push(dim);
                }
            } else {
                for (let i = 2; i < input_dim.length; i+=1) {
                    dim = Math.ceil(input_dim[i]/this.stride[i-2]);
                    output_dim.push(dim);
                    this.padding[i-2] = (dim - 1) * this.stride[i-2] + ((this.kernel_shape[i-2] - 1) * this.dilation[i-2] + 1) - input_dim[i];
                }
            }
        }

        this.outputs[this.node.output[0]] = output_dim;
        this.outputs[this.node.output[1]] = output_dim;
    }

    parseAttributes(input_dim) {
        this.auto_pad = 'NOTSET';
        this.ceil_mode = 0;
        this.dilation = Array(input_dim.length - 2).fill(1);
        this.kernel_shape = input_dim.slice(2,);
        this.padding = Array(input_dim.length - 2).fill(0);
        this.stride = Array(input_dim.length - 2).fill(1);

        for (let attribute of this.node.attribute) {
            switch (attribute.name) {
                case "dilations":
                    this.dilation = attribute.ints;
                    break;
                case "pads":
                    var padding = [];
                    for (let i = 0; i < attribute.ints.length / 2; i += 1)
                        padding.push(attribute.ints[i] + attribute.ints[i + attribute.ints.length/2]);
                    this.padding = padding;
                    break;
                case "strides":
                    this.stride = attribute.ints;
                    break;
                case "auto_pad":
                    this.auto_pad = attribute.s;
                    break;
                case "ceil_mode":
                    this.ceil_mode = attribute.i;
                    break;
                case "kernel_shape":
                    this.kernel_shape = attribute.ints;
            }
        }
    }
}

class MaxPool extends Pool {

    constructor(node, global=false) {
        super(node, global)
    }

    calculateOps() {
        let ops_per_output = this.kernel_shape.reduce((a, b) => a*b) - 1;
        let output_dim = this.outputs[this.node.output[0]];
        this.ops = output_dim.reduce((a, b) => a*b) * ops_per_output;
    }
}

class AvgPool extends Pool {
    
    constructor(node, global=false) {
        super(node, global);
    }

    calculateOps() {
        let ops_per_output = this.kernel_shape.reduce((a, b) => a*b);
        let output_dim = this.outputs[this.node.output[0]];
        this.ops = output_dim.reduce((a, b) => a*b) * ops_per_output;
    }
}

class Flatten extends Layer {

    axis = 1;

    constructor(node) {
        super(node);
    }

    calculateOutputDim() {
        var [input_name,] = this.node.input;
        var input_dim = this.inputs[input_name].outputs[input_name];
        this.parseAttributes();

        if (this.axis < 0) {
            this.axis = input_dim.length + this.axis;
        }

        var output_dim = Array(2).fill(1);
        for (let i = 0; i < this.axis; i++) output_dim[0] *= input_dim[i];
        for (let i = this.axis; i < input_dim.length; i++) output_dim[1] *= input_dim[i];
        this.outputs[this.node.output[0]] = output_dim;
    }

    parseAttributes() {
        for (let attribute of this.node.attribute) {
            switch (attribute.name) {
                case "axis":
                    this.axis = attribute.i;
            }
        }
    }
}

class Reshape extends Layer {

    constructor(node) {
        super(node);
    }

    calculateOutputDim() {
        console.log(this.node, this);
        var [input_name, shape_name] = this.node.input;
        var input_dim = this.inputs[input_name].outputs[input_name];  
        
        var shape_raw;
        if (this.inputs[shape_name].value) 
            shape_raw = this.inputs[shape_name].value
        else 
            shape_raw = this.inputs[shape_name].initializer.rawData;

        var shape_dim = [];
        for (let i = 0; i < shape_raw.length; i += 8) {
            shape_dim.push((new Int64LE(shape_raw.slice(i, i+8))).toNumber());
        }

        var num_input_elements = input_dim.reduce((a, b) => a*b);
        var num_output_elements = 1;
        for (let i = 0; i < shape_dim.length; i++) {
            if (shape_dim[i] === 0) shape_dim[i] = input_dim[i];
            num_output_elements *= shape_dim[i];
        }

        if (num_output_elements < 0) {
            for (let i = 0; i < shape_dim.length; i++) {
                if (shape_dim[i] === -1) shape_dim[i] = num_input_elements / -num_output_elements;
            }
        }

        this.outputs[this.node.output[0]] = shape_dim;
    }

}


class ArgMax extends Layer {

    axis = 0;
    keepdims = 1;
    select_last_index = 0;
    reducedDimValue = 0;

    constructor(node) {
        super(node);
    }

    calculateOutputDim() {
        var [input_name,] = this.node.input;
        var input_dim = this.inputs[input_name].outputs[input_name];
        this.parseAttributes();

        var output_dim = [...input_dim];
        this.reducedDimValue = input_dim[this.axis];

        output_dim[this.axis] = 1;
        if (this.keepdims !== 1) {
            output_dim.splice(this.axis, 1);
        }
        this.outputs[this.node.output[0]] = output_dim;
    }

    parseAttributes() {
        for (let attribute of this.node.attribute) {
            switch (attribute.name) {
                case "axis":
                    this.axis = attribute.i;
                    break;
                case "keepdims":
                    this.keepdims = attribute.i;
                    break;
                case "select_last_index":
                    this.select_last_index = attribute.i;
                    break;
            }
        }
    }

    calculateOps() {
        this.ops = this.reducedDimValue - 1; //these many comparisions
    }
}


export {parseNodeProto, Input, Weight, Output};