const Int64LE = require("int64-buffer").Int64LE;

function protoGenNode(nodeProto, inputs, input_names) {
  let node = {};

  let opType = nodeProto.opType;
  node['op'] = opType;
  node['outputs'] = nodeProto.output;

  if (opType === "Conv") {
    let [data, weight, bias] = inputs;
    let out_channels, stride, kernel_size, padding, dilation, groups;

    bias = !(bias === undefined);
    out_channels = weight[0];

    for (let x of nodeProto.attribute) {
      if (x.name === "strides") stride = x.ints;
      else if (x.name === "kernel_shape") kernel_size = x.ints;
      else if (x.name === "pads") {
        padding = [];
        for (let i = 0; i < x.ints.length; i += 2)
          padding.push(x.ints[i] + x.ints[i + 1]);
      }
      else if (x.name === "dilations") dilation = x.ints;
      else if (x.name === "group") groups = x.i
    }

    if (dilation === undefined) dilation = Array(stride.length).fill(1);
    if (padding  === undefined) padding  = Array(stride.length).fill(0);
    if (groups   === undefined) groups   = 1;

    node['params'] = {
      out_channels,
      kernel_size,
      stride,
      padding,
      dilation,
      groups,
      bias
    };
    node['inputs'] = [input_names[0]];
  }
  else if (opType === "AveragePool" || opType === "MaxPool") {
    let kernel_size, stride, padding;

    for (let x of nodeProto.attribute) {
      if (x.name === "strides") stride = x.ints;
      else if (x.name === "kernel_shape") kernel_size = x.ints;
      else if (x.name === "pads") {
        padding = [];
        for (let i = 0; i < x.ints.length; i += 2)
          padding.push(x.ints[i] + x.ints[i + 1]);
      }
    }

    if (stride  === undefined) stride  = Array(kernel_size.length).fill(1);
    if (padding === undefined) padding = Array(kernel_size.length).fill(0);

    node['params'] = { kernel_size, stride, padding };
    node['inputs'] = [input_names[0]];
  }
  else if (opType === "Gemm") {
    // res = (A * B) + C
    // If A is undefined, but B and C are defined, it is a FC
    // Otherwise treat is as Gemm;
    let [A, B, C] = inputs;

    let transA, transB, alpha, beta;

    transA = 0;
    transB = 0;
    alpha  = 1;
    beta   = 1;
    for (let x of nodeProto.attribute) {
      if (x.name === "transA") transA = x.i;
      else if (x.name === "transB") transB = x.i;
      else if (x.name === "alpha") alpha = x.f;
      else if (x.name === "beta") beta = x.f;
    }

    node['inputs'] = []
    if (A === undefined) {
      // Linear layer
      node['op'] = 'Linear';
      let out_features, bias;
      out_features = (transB) ? B[0] : B[1];
      bias = !(C === undefined);
      node['params'] = {out_features, bias};
      node['inputs'].push(input_names[0]);
    } else {
      console.error("Gemm for layers other than linear not supported rn");
      if (A === undefined) node['inputs'].push(input_names[0]);
      if (B === undefined) node['inputs'].push(input_names[1]);
      if (C === undefined) node['inputs'].push(input_names[2]);
      node['params'] = {transA, transB, alpha, beta};
    }
  }
  else if (opType === "BatchNormalization") {
    let [data, scale, bias, mean, v] = inputs;

    let num_features, spatial;

    spatial = true;
    for (let x of nodeProto.attribute)
      if (x.name === "spatial" && x.i === 0) spatial = false;

    num_features = scale[0];

    node['params'] = {num_features, spatial};
    node['inputs'] = [input_names[0]];
  }
  else if (opType === "LRN") {
    let size;
    for (let x of nodeProto.attribute)
      if (x.name === "size") size = x.i;
    node['params'] = { size };
    node['inputs'] = [input_names[0]];
  }
  else if (opType === "Reshape") {
      let [data, shape] = inputs;
      node['params'] = { shape };
      node['inputs'] = [input_names[0]];
  }
  else if (opType === "Transpose") {
    let perm;
    for (let x of nodeProto.attribute)
      if (x.name === "perm") perm = x.ints;
    if (perm !== undefined) node['params'] = { perm };
    node['inputs'] = [input_names[0]];
  }
  else if (opType === "Concat" || opType === "Softmax") {
    let axis;
    axis = 1;
    for (let x of nodeProto.attribute)
      if (x.name === "axis") axis = x.i;
    node['params'] = { axis };
    node['inputs'] = input_names;
  }
  else if (opType === "Dropout") {
    let ratio;
    for (let x of nodeProto.attribute)
      if (x.name === "ratio") ratio = x.f;
    node['params'] = { ratio };
    node['inputs'] = [input_names[0]];
  }
  else if (opType === "Relu" || opType === "Sum" || opType === "Add") {
    node['inputs'] = input_names;
  }
  else {
    console.log("Not implemented for " + opType);
  }

  return node;
}

// ONNX parser class
class ONNX {

  constructor() {
    // List of parsed layers that can be JSONified to display
    this.layers = [];
    // Object to store input to shape mappings to create graph
    this.input_shapes = {};
    this.processing = false;
  }

  parseCode(model) {
    this.processing = true;
    this.layers = model;
    this.calc();
  }

  parseProto(model) {
    this.processing = true;
    this.layers = [];
    this.input_shapes = {};

    let weights = {};
    for (let initializer of model.graph.initializer) {
      let shape = initializer.dims;
      let raw   = initializer.rawData;
      weights[initializer.name] = {shape,  raw};
    }
    const weight_names = Object.keys(weights);

    let inputs = {};
    for (let input of model.graph.input) {
      if (weight_names.includes(input.name)) continue;
      const dim = input.type.tensorType.shape.dim;
      let shape = [];
      for (let x of dim) shape.push(x.dimValue);
      inputs[input.name] = shape;
      this.layers.push({
        op: "Input",
        outputs: [String(input.name)],
        params: {
          size: shape,
        },
      });
    }

    for (let node of model.graph.node) {
      let local_inputs = {};
      for (let input of node.input) {
        if (!weight_names.includes(input)) {
          local_inputs[input] = inputs[input];
        }
        else {
          local_inputs[input] = weights[input].shape;
          if (node.opType === 'Reshape') {
            let raw = weights[input].raw;
            let val = [];
            for (let j = 0; j < raw.length; j = j + 8) {
              val.push((new Int64LE(raw.slice(j, j + 8))).toNumber());
            }
            local_inputs[input] = val;
          }
        }
      }
      this.layers.push(protoGenNode(
        node,
        Object.values(local_inputs),
        Object.keys(local_inputs)
      ));
    }

    for (let output of model.graph.output) {
      const dim = output.type.tensorType.shape.dim;
      this.layers.push({
        op: "Output",
        inputs: [String(output.name)],
      });
    }

    this.calc();
  }

  calc() {
    this.input_shapes = {};

    let unprocessed_layers = [];
    for (let layer of this.layers) unprocessed_layers.push(layer);

    while (unprocessed_layers.length > 0) {
      let layer = unprocessed_layers.shift();

      // Check to make sure we have the input available
      let hasInputs = true;
      let defined_inputs = Object.keys(this.input_shapes);
      if (layer.inputs !== undefined) {
        for (let input of layer.inputs) {
          hasInputs = hasInputs && (defined_inputs.includes(input));
        }
      }
      if (!hasInputs) {
        unprocessed_layers.push(layer);
        continue;
      }

      let ops = 0;
      let params = 0;
      if (layer.op === "Input") {
        this.input_shapes[layer.outputs[0]] = layer.params.size;
      }
      else if (layer.op === "Conv") {
        let [batch, in_channels, ...in_dims] = this.input_shapes[layer.inputs[0]];
        let ks = layer.params.kernel_size;
        let stride = layer.params.stride;
        let pad = layer.params.padding;
        let dilation = layer.params.dilation;
        let group = layer.params.groups;
        let bias = layer.params.bias;

        let output_size = [batch, layer.params.out_channels];
        for (let i in in_dims) {
          let out_dim;
          out_dim = (in_dims[i] + pad[i] - (dilation[i] * (ks[i] - 1)) - 1);
          out_dim = Math.floor((out_dim / stride[i]) + 1);
          output_size.push(out_dim);
        }
        this.input_shapes[layer.outputs[0]] = output_size;

        let ops_per_output;
        ops_per_output = 2 * ((in_channels / group) * ks.reduce((a, b) => a*b));
        ops_per_output = ops_per_output - 1;
        if (bias) ops_per_output += 1;
        ops = output_size.reduce((a, b) => a*b) * ops_per_output;

        params = ks.reduce((a, b) => a*b);
        params *= (in_channels / group);
        params *= layer.params.out_channels;
        if (bias) params += layer.params.out_channels;
      }
      else if (layer.op === "MaxPool" || layer.op === "AveragePool") {
        let [batch, in_channels, ...in_dims] = this.input_shapes[layer.inputs[0]];
        let ks = layer.params.kernel_size;
        let stride = layer.params.stride;
        let pad = layer.params.padding;

        let output_size = [batch, in_channels];
        for (let i in in_dims) {
          let out_dim;
          out_dim = in_dims[i] + pad[i] - ks[i];
          out_dim = Math.floor((out_dim / stride[i]) + 1);
          output_size.push(out_dim);
        }

        this.input_shapes[layer.outputs[0]] = output_size;
        if (layer.op === "MaxPool")
          this.input_shapes[layer.outputs[1]] = output_size;

        let ops_per_output;
        ops_per_output = ks.reduce((a, b) => a*b) - 1;
        ops = output_size.reduce((a, b) => a*b) * ops_per_output;
      }
      else if (layer.op === "Linear") {
        let [batch, in_channels] = this.input_shapes[layer.inputs[0]];
        let out_features = layer.params.out_features;
        let bias = layer.params.bias;

        let output_size = [batch, out_features];
        this.input_shapes[layer.outputs[0]] = output_size;

        let ops_per_output;
        ops_per_output = (in_channels * 2 - 1);
        if (bias) ops_per_output += 1;
        ops = (batch * out_features) * ops_per_output ;

        params = (in_channels * out_features);
        if (bias) params += out_features;
      }
      else if (layer.op === "BatchNormalization") {
        let input = this.input_shapes[layer.inputs[0]];

        this.input_shapes[layer.outputs[0]] = input;

        ops = input.reduce((a, b) => a*b) * 2;
        params = 4 * input[1];
      }
      else if (layer.op === "LRN") {
        let size = layer.params.size;
        let input = this.input_shapes[layer.inputs[0]];

        this.input_shapes[layer.outputs[0]] = input;

        let ops_per_output;
        ops_per_output = size + (size - 1) //Squared sum
        ops_per_output += 4; //constant mul, add, exp, div

        ops = ops_per_output * input.reduce((a, b) => a*b);
        params = 4;
      }
      else if (layer.op === "Relu") {
        let input = this.input_shapes[layer.inputs[0]];
        this.input_shapes[layer.outputs[0]] = input;
        ops = input.reduce((a, b) => a*b);
      }
      else if (layer.op === "Reshape") {
        let input = this.input_shapes[layer.inputs[0]];
        let shape = new Array(...layer.params.shape);
        for (let i in shape) if (shape[i] === 0) shape[i] = input[i];
        let dataProd = input.reduce((a, b) => a*b);
        let shapeProd = shape.reduce((a, b) => a*b);
        for (let i in shape)
          if (shape[i] === -1)
            shape[i] = (dataProd / (-1 * shapeProd));
        this.input_shapes[layer.outputs[0]] = shape;
      }
      else if (layer.op === "Transpose") {
        let input = this.input_shapes[layer.inputs[0]];
        let perm = Array(input.length);
        for (let i in input) perm[i] = Number(i);
        perm = perm.reverse();
        if (layer.params !== undefined && layer.params.perm !== undefined)
          perm = layer.params.perm;

        let output_size = [];
        for (let i in input)
          output_size[i] = input[perm[i]];

        this.input_shapes[layer.outputs[0]] = new Array(...output_size);
      }
      else if (layer.op === "Concat") {
        let inputs = [];
        for (let input of layer.inputs)
          inputs.push(this.input_shapes[input]);
        let axis = layer.params.axis;
        let output_size = new Array(...inputs[0]);
        for (let x of inputs.slice(1)) output_size[axis] += x[axis];
        this.input_shapes[layer.outputs[0]] = output_size;
      }
      else if (layer.op === "Dropout") {
        let input = this.input_shapes[layer.inputs[0]];
        this.input_shapes[layer.outputs[0]] = input;
        this.input_shapes[layer.outputs[1]] = input;
        params = 1;
      }
      else if (layer.op === "Softmax") {
        let input = this.input_shapes[layer.inputs[0]];
        let axis = layer.params.axis;
        this.input_shapes[layer.outputs[0]] = input;
        ops = (input.slice(axis).reduce((a, b) => (a * b)) * 3);
      }
      else if (layer.op === "Sum") {
        let inputs = [];
        for (let input of layer.inputs)
          inputs.push(this.input_shapes[input]);

        let maxLen = 0;
        for (let x of inputs) if (x.length > maxLen) maxLen = x.length;
        let output_size = Array(maxLen);
        output_size.fill(1);
        for (let x of inputs) {
            let idx = output_size.length - x.length;
            for (let i in x) {
              output_size[idx] = (output_size[idx] > x[i]) ? output_size[idx] : x[i];
              idx += 1;
            }
        }

        this.input_shapes[layer.outputs[0]] = output_size;
        ops = output_size.reduce((a, b) => a*b) * inputs.length;
      }
      else if (layer.op === "Output"){

      }
      else {
        console.error(layer.op + " Not valid");
      }
      layer['numOps'] = ops;
      layer['numParams'] = params;
    }
    this.processing = false;
  }


}

export default ONNX;
