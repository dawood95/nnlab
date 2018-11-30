import compute from '@/utils/parser.js';
import ONNX from '@/utils/onnx.js';

const stringify = require("json-stringify-pretty-compact");

const state = {
  fileName: undefined,
  modelName: '',
  producerName: '',
  opsetVersion: '',
  compileStatus: 'done',
  onnx: new ONNX(),
};

const getters = {
  fileName: st => st.fileName,
  compileStatus: st => st.compileStatus,
  code: st => {
    return stringify(st.onnx.layers.map((d, i) => {
      let newObj = {};
      for (let k of ['op', 'inputs', 'params', 'outputs']) {
        if (d[k] === undefined) continue;
        //if (k === 'numOps' || k === 'numParams') continue;
        newObj[k] = d[k];
      }
      return newObj;
    }), {indent: 2, maxLength: 30});
  },
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
  nodes: st => {
    if (st.onnx.processing === true) return [];
    return st.onnx.layers.map((d, i) => {
      let newObj = {};
      for (let k of Object.keys(d)) {
        newObj[k] = d[k];
        if (k === 'inputs') {
          let newMap = {};
          for (let input of d[k]) {
            newMap[input] = st.onnx.input_shapes[input];
          }
          newObj[k] = newMap;
        }
      }
      return newObj;
    });
  },
  totalOps: st => {
    if (st.onnx.processing === true) return [];
    return st.onnx.layers.map((d, i) => {
      return d.numOps;
    });
  },//String(st.totalOps / 1e9) + ' G',
  totalParams: st => {
    if (st.onnx.processing === true) return [];
    return st.onnx.layers.map((d, i) => {
      return d.numParams;
    });
  },
};

const mutations = {
  setFileName: (st, fileName) => {
    st.fileName = fileName;
  },
  setModel: (st, modelProto) => {
    st.onnx.parseProto(modelProto, st);
    st.modelName = modelProto.graph.name;
    st.producerName = modelProto.producerName;
    st.opsetVersion = modelProto.opsetImport[0].version;
  },
  setCode: (st, modelDef) => {
    st.onnx.parseCode(modelDef, st);
  },
  setCompileStatus: (st, stat) => {
    st.compileStatus = stat;
  }
};

const actions = {
};

export default {
  state,
  getters,
  mutations,
  actions,
};
