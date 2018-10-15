import compute from '@/utils/parser.js';

const state = {
  fileName: '',
  modelName: '',
  producerName: '',
  opsetVersion: '',
  inputs: [],
  outputs: [],
  modelProto: '',
  nodes: [],
  totalOps: [],
  totalParams: [],
};

const getters = {
  fileName: st => st.fileName,
  metaInfo: st => {
    return [
      {
        name: 'Model Name',
        value: st.modelName,
      },
      {
        name: 'Producer Name',
        value: st.producerName,
      },
      {
        name: 'Opset Version',
        value: st.opsetVersion
      }
    ];
  },
  inputs: st => st.inputs,
  outputs: st => st.outputs,
  distOpsParams: (st) => {
    let ops = {};
    let params = {};
    for (let x in st.nodes) {
      if (ops[st.nodes[x].opType])
        ops[st.nodes[x].opType] += st.totalOps[x];
      else
        ops[st.nodes[x].opType] = st.totalOps[x];

      if (params[st.nodes[x].opType])
        params[st.nodes[x].opType] += st.totalOps[x];
      else
        params[st.nodes[x].opType] = st.totalOps[x];
    }
    return {
      names: Object.keys(ops),
      ops: Object.values(ops),
      params: Object.values(params)
    };
  },
  totalOps: st => st.totalOps,//String(st.totalOps / 1e9) + ' G',
  totalParams: st => st.totalParams,//String(st.totalParams / 1e6) + ' M'
};

const mutations = {
  setFileName: (st, fileName) => {
    st.fileName = fileName;
  },
  setModel: (st, modelProto) => {
    console.log(modelProto);
    //st.modelProto = modelProto;
    while (st.totalOps.length > 0) st.totalOps.pop();
    while (st.totalParams.length > 0) st.totalParams.pop();
    while (st.nodes.length > 0) st.nodes.pop();

    st.modelName = modelProto.graph.name;
    st.producerName = modelProto.producerName;
    st.opsetVersion = modelProto.opsetImport[0].version;

    let modelInputs = {};
    let modelInitializers = [];

    const initializers = modelProto.graph.initializer;
    const inputs = modelProto.graph.input;

    for (let i in inputs) {
      modelInputs[inputs[i].name] = inputs[i];
    }

    for (let i in initializers) {
      //if (initializers[i].name.includes('DUMMY')) {
      //  console.log(initializers[i]);
      let shape = initializers[i].dims;
      let raw   = initializers[i].rawData;
      modelInitializers[initializers[i].name] = { shape,  raw };
      delete modelInputs[initializers[i].name];
    }

    st.inputs = [];
    for (let i in modelInputs) {
      let shape = [];
      for (let x of modelInputs[i].type.tensorType.shape.dim) shape.push(x.dimValue);
      st.inputs.push({
        name: modelInputs[i].name,
        shape: shape,
      });
      modelInputs[modelInputs[i].name] = shape
    }

    st.outputs = [];
    const outputs = modelProto.graph.output;
    for (let i in outputs) {
      let shape = [];
      for (let x of outputs[i].type.tensorType.shape.dim) shape.push(x.dimValue);
      st.outputs.push({
        name: outputs[i].name,
        shape: shape,
      })
    }

    const nodes = modelProto.graph.node;
    for (let i in nodes) {
      //console.log(nodes[i]);
      let local_inputs = {};
      for (let x in nodes[i].input) {
        const input_name = nodes[i].input[x]
        if (!Object.keys(modelInitializers).includes(input_name)) {
          local_inputs[input_name] = modelInputs[input_name];
        } else {
          local_inputs[input_name] = modelInitializers[input_name].shape;
          if (nodes[i].opType === 'Reshape') {
            let Int64LE = require("int64-buffer").Int64LE;
            let val = [];
            for (let j = 0; j < modelInitializers[input_name].raw.length; j = j + 8) {
              val.push((new Int64LE(modelInitializers[input_name].raw.slice(j, j + 8))).toNumber());
            }
            local_inputs[input_name] = val;
          }
        }
      }

      let { ops, params, output_sizes } = compute(nodes[i].opType, local_inputs, nodes[i].attribute);

      for (let x in nodes[i].output)
        modelInputs[nodes[i].output[x]] = output_sizes[x];

      st.totalOps.push(ops);
      st.totalParams.push(params);
      st.nodes.push({
        opType: nodes[i].opType,
        inputs: nodes[i].input,
        outputs: nodes[i].output,
        attributes: nodes[i].attributes
      })
      console.log(nodes[i].opType, output_sizes[0], ops, params);
    }
  },
};

const actions = {
};

export default {
  state,
  getters,
  mutations,
  actions,
};
