const compute = (opType, inputs, attributes) => {
  let ops = 0;
  let params = 0;
  let output_sizes = [];

  switch (opType) {
    case "Conv": {
      let [data, weight, bias] = Object.values(inputs);
      let stride = [];
      let ks = [];
      let pad = [];
      let dilation = [];
      let group = 1;

      for (let x of attributes) {
        switch (x.name) {
          case "strides":
            stride = x.ints;
            break;
          case "kernel_shape":
            ks = x.ints;
            break;
          case "pads":
            for (let i = 0; i < x.ints.length; i += 2)
              pad.push(x.ints[i] + x.ints[i + 1]);
            break;
          case "dilations":
            dilation = x.ints;
            break;
          case "group":
            group = x.i;
            break;
          default:
            break;
        }
      }

      if (dilation.length === 0) dilation = Array(stride.length).fill(1);
      if (pad.length === 0) pad = Array(stride.length).fill(0);

      let [batch, in_channels, ...in_dims] = data;
      let out_channels = weight[0] * group;
      let output_size = [];

      output_size.push(batch);
      output_size.push(out_channels);
      for (let i in in_dims){
        let out_dim;
        out_dim = (in_dims[i] + pad[i] - (dilation[i] * (ks[i] - 1)) - 1);
        out_dim = Math.floor((out_dim / stride[i]) + 1);
        output_size.push(out_dim);
      }
      output_sizes.push(output_size);

      let ops_per_output;
      ops_per_output = 2 * ((in_channels / group) * ks.reduce((a, b) => a*b));
      ops_per_output = ops_per_output - 1;
      if (bias !== undefined) ops_per_output += 1;
      ops = output_size.reduce((a, b) => a*b) * ops_per_output;

      params = weight.reduce((a, b) => a*b)
      if (bias !== undefined) params += bias.reduce((a, b) => a*b);
      params = params * group;

      break;
    }
    case "AveragePool":
      let average = true;
    case "MaxPool": {
      let [data] = Object.values(inputs);
      let stride = [];
      let ks = [];
      let pad = [];

      for (let x of attributes) {
        switch (x.name) {
          case "strides":
            stride = x.ints;
            break;
          case "kernel_shape":
            ks = x.ints;
            break;
          case "pads":
            for (let i = 0; i < x.ints.length; i += 2)
              pad.push(x.ints[i] + x.ints[i + 1]);
            break;
          default:
            break;
        }
      }

      if (pad.length === 0) pad = Array(ks.length).fill(0);
      if (stride.length === 0) pad = Array(ks.length).fill(1);

      let [batch, in_channels, ...in_dims] = data;
      let output_size = [];
      output_size.push(batch);
      output_size.push(in_channels);
      for (let i in in_dims){
        let out_dim;
        out_dim = in_dims[i] + pad[i] - ks[i];
        out_dim = Math.floor((out_dim / stride[i]) + 1);
        output_size.push(out_dim);
      }
      output_sizes.push(output_size);
      if (!average) output_sizes.push(output_size);

      let ops_per_output;
      ops_per_output = ks.reduce((a, b) => a*b) - 1;
      ops = output_size.reduce((a, b) => a*b) * ops_per_output;

      break;
    }
    case "Gemm": {
      let [A, B, C] = Object.values(inputs);
      let transA = 0;
      let transB = 0;
      for (let x of attributes) {
        switch (x.name) {
          case "transA":
            transA = Number(x.i);
            break;
          case "transB":
            transB = Number(x.i);
            break;
          default:
            break;
        }
      }

      let m, n, k = 0;
      m = (transA) ? A[1] : A[0];
      n = (transB) ? B[0] : B[1];
      k = (transA) ? A[0] : A[1];
      output_sizes.push([m, n]);

      ops += (m * n) * (k * 2 + 1);
      params += (B.reduce((a, b) => a*b) + (m * n));
    }
    case "BatchNormalization": {
      let [data, ...dc] = Object.values(inputs);
      output_sizes.push(data);
      ops = data.reduce((a, b) => a*b) * 2; // 1 for sub, 1 for div
      for (let x of dc) {
        params += x.reduce((a, b) => a*b);
      }
      break;
    }
    case "Relu": {
      let [data] = Object.values(inputs);
      output_sizes.push(data);
      ops = data.reduce((a, b) => a*b); // element-wise
      params = 0;
      break;
    }
    case "Reshape": {
      let [data, shape] = Object.values(inputs);
      for (let i in shape) if (shape[i] === 0) shape[i] = data[i];
      let dataProd = data.reduce((a, b) => a*b);
      let shapeProd = shape.reduce((a, b) => a*b);
      for (let i in shape) if (shape[i] === -1) shape[i] = (dataProd / (-1 * shapeProd));
      output_sizes.push(shape);
      break;
    }
    case "Transpose": {
      let [data] = Object.values(inputs);
      let perm = Array(data.length);
      for (let i in data) perm[i] = Number(i);
      for (let x of attributes) if (x.name === "perm") perm = x.ints;
      let output_size = [];
      for (let i in data)
        output_size[i] = data[perm[i]];
      output_sizes.push(output_size);
      break;
    }
    case "Concat": {
      let data = Object.values(inputs);
      let axis = '';
      for (let x of attributes) if (x.name === "axis") axis = Number(x.i);
      let output_size = data[0];
      for (let x of data.slice(1)) output_size[axis] += x[axis];
      output_sizes.push(output_size);
      break;
    }
    case "LRN": {
      let [data] = Object.values(inputs);
      let numel = data.reduce((a, b) => a*b);

      output_sizes.push(data);

      ops += numel * 2; // squared sum
      ops += 3; // denominator
      ops += numel; // per element div

      params += 4;
      break;
    }
    case "Dropout": {
      let [data] = Object.values(inputs);
      output_sizes.push(data);
      output_sizes.push(data);
      params += 1;
      break;
    }
    case "Softmax": {
      let [data] = Object.values(inputs);
      let axis = 1;
      for (let x of attributes) {
        if (x.name == "axis") {
          axis = Number(x.i);
        }
      }
      output_sizes.push(data);

      ops += (data.slice(axis).reduce((a, b) => (a * b)) * 3);
      break;
    }
    default:
      console.log("Not implemented yet for " + opType);
      break;
  };

  return { ops, params, output_sizes };
};

export default compute;
